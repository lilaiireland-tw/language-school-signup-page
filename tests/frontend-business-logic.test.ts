import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDirectApplicationReadiness } from "../app/lib/application/readiness.ts";
import { sanitizeApplicationPayload } from "../app/lib/application/sanitize.ts";
import { BRAND_LINKS } from "../app/lib/brand-links.ts";
import { getSchoolOptionsForCity, partnerSchools, visiblePartnerSchools } from "../app/lib/schools.ts";
import type { DirectApplicationFormData } from "../app/lib/types.ts";
import { parseApplicationInput } from "../worker/validation/application-schema.ts";
import { GOOGLE_ADS_CONVERSION_SEND_TO, trackGoogleAdsConversion } from "../app/lib/analytics.ts";

function form(overrides: Partial<DirectApplicationFormData> = {}): DirectApplicationFormData {
  return {
    serviceType: "direct_application", chineseName: "測試", email: "test@example.com", phone: "0900000000", lineId: "",
    currentLocation: "台灣", preferredCity: "Dublin", preferredSchool: "ISI Dublin", customSchool: "", courseType: "25+8 長期語言課程",
    expectedStartMonth: "2027-01", courseDuration: "25+8 課程", classSchedule: "上午", accommodationNeeded: "不需要",
    partnerAccommodationInterest: "", quoteStatus: "尚未取得", decisionStage: "我已確認主要學校及課程，可以直接報名",
    consultationGoal: "stale consultation value", budgetRange: "NT$200,000–250,000（約 €5,500–€6,900）", additionalNotes: "", discoverySource: "", agreements: { "agreement-0": true, isic: true },
    utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "", utmTerm: "", gclid: "", landingPageUrl: "https://example.com/path", isicInitiallyEligible: true,
    ...overrides,
  };
}

test("Erin stays in the dataset but is hidden and cannot be selected", () => {
  const erin = partnerSchools.filter((item) => item.name.startsWith("Erin College"));
  assert.equal(erin.length, 2);
  assert.ok(erin.every((item) => item.status === "review" && !item.visible && !item.directApplicationEligible));
  assert.ok(visiblePartnerSchools.every((item) => !item.name.startsWith("Erin College")));
  assert.ok(!getSchoolOptionsForCity("Dublin").includes("Erin College Dublin"));
  assert.ok(!getSchoolOptionsForCity("Cork").includes("Erin College Cork"));
});

test("assessment URL has one approved source of truth", () => {
  assert.equal(BRAND_LINKS.website, "https://lilaiireland.com/");
  assert.equal(BRAND_LINKS.assessment, "https://lilaiireland.com/consult/");
});

test("direct readiness distinguishes ready, partial, and consultation review", () => {
  assert.deepEqual(evaluateDirectApplicationReadiness(form()), { ready: true, requiresConsultationReview: false, reasons: [] });
  const partial = evaluateDirectApplicationReadiness(form({ preferredSchool: "尚未確定" }));
  assert.equal(partial.ready, true);
  const review = evaluateDirectApplicationReadiness(form({ preferredCity: "尚未確定", preferredSchool: "尚未確定", decisionStage: "我仍需要完整比較不同學校或城市" }));
  assert.equal(review.ready, false);
  assert.equal(review.requiresConsultationReview, true);
});

test("only consultation accepts uncertain select values", () => {
  for (const [field, value] of [
    ["preferredCity", "尚未確定"], ["preferredSchool", "尚未確定"], ["courseType", "尚未確定／希望諮詢"],
    ["expectedStartMonth", "尚未確定"], ["courseDuration", "尚未確定"], ["classSchedule", "尚未確定"],
    ["accommodationNeeded", "尚未確定"], ["budgetRange", "尚未確認"],
  ] as const) {
    assert.throws(() => parseApplicationInput(form({ [field]: value })), /直接報名請選擇已確認/);
  }

  const consultation = parseApplicationInput(form({
    serviceType: "consultation", preferredCity: "尚未確定", preferredSchool: "", courseType: "尚未確定／希望諮詢",
    expectedStartMonth: "尚未確定", courseDuration: "尚未確定", classSchedule: "尚未確定",
    accommodationNeeded: "不需要", budgetRange: "尚未確認", decisionStage: "", consultationGoal: "還不確定，想從頭一起討論",
  }));
  assert.equal(consultation.preferredCity, "尚未確定");
  assert.equal(consultation.courseType, "尚未確定／希望諮詢");
  assert.equal(consultation.budgetRange, "尚未確認");
});

test("payload sanitizer removes fields from the inactive mode", () => {
  const direct = sanitizeApplicationPayload(form());
  assert.equal(direct.consultationGoal, "");
  assert.equal(direct.isicInitiallyEligible, true);
  const consultation = sanitizeApplicationPayload(form({ serviceType: "consultation", decisionStage: "stale", preferredSchool: "stale", customSchool: "stale", consultationGoal: "比較城市與生活成本" }));
  assert.equal(consultation.preferredSchool, "");
  assert.equal(consultation.customSchool, "");
  assert.equal(consultation.decisionStage, "");
  assert.equal(consultation.isicInitiallyEligible, false);
  assert.equal(consultation.agreements.isic, undefined);
});

test("server validation enforces direct ISIC acknowledgement and minimizes stored URLs", () => {
  const source = form({ landingPageUrl: "https://lilaiireland.com/language-school-signup/?utm_source=test#form" });
  assert.throws(() => parseApplicationInput({ ...source, agreements: { "agreement-0": true } }), /ISIC/);
  const parsed = parseApplicationInput(source);
  assert.equal(parsed.landingPageUrl, "https://lilaiireland.com/language-school-signup/");
  assert.equal(parsed.consultationGoal, "");
  assert.equal(parsed.isicInitiallyEligible, true);
});

test("server validation removes stale direct-only consultation fields", () => {
  const source = form({ serviceType: "consultation", preferredSchool: "stale", customSchool: "stale", decisionStage: "stale", consultationGoal: "比較城市與生活成本", isicInitiallyEligible: true });
  const parsed = parseApplicationInput(source);
  assert.equal(parsed.preferredSchool, "");
  assert.equal(parsed.customSchool, "");
  assert.equal(parsed.decisionStage, "");
  assert.equal(parsed.isicInitiallyEligible, false);
  assert.equal(parsed.agreements.isic, undefined);
});

function installTrackingWindow(gtag?: (...args: unknown[]) => void) {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      gtag,
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    },
  });
  return storage;
}

test("Google Ads maps direct and consultation submissions to only their own labels", () => {
  const calls: unknown[][] = [];
  installTrackingWindow((...args: unknown[]) => calls.push(args));

  assert.equal(trackGoogleAdsConversion("direct_application", "ST-123456"), true);
  assert.equal(trackGoogleAdsConversion("consultation", "ST-123457"), true);
  assert.deepEqual(calls, [
    ["event", "conversion", { send_to: GOOGLE_ADS_CONVERSION_SEND_TO.direct_application, transaction_id: "direct_application:ST-123456" }],
    ["event", "conversion", { send_to: GOOGLE_ADS_CONVERSION_SEND_TO.consultation, transaction_id: "consultation:ST-123457" }],
  ]);
  assert.notEqual(GOOGLE_ADS_CONVERSION_SEND_TO.direct_application, GOOGLE_ADS_CONVERSION_SEND_TO.consultation);

  delete (globalThis as { window?: unknown }).window;
});

test("Google Ads conversion rejects invalid IDs, deduplicates repeats, and allows different applications", () => {
  const calls: unknown[][] = [];
  installTrackingWindow((...args: unknown[]) => calls.push(args));

  assert.equal(trackGoogleAdsConversion("direct_application", "not-an-application-id"), false);
  assert.equal(trackGoogleAdsConversion("direct_application", "ST-223456"), true);
  assert.equal(trackGoogleAdsConversion("direct_application", "ST-223456"), false);
  assert.equal(trackGoogleAdsConversion("direct_application", "ST-223457"), true);
  assert.equal(calls.length, 2);

  delete (globalThis as { window?: unknown }).window;
});

test("Google Ads blocking, missing gtag, and SSR never interrupt successful application UI", () => {
  installTrackingWindow();
  assert.doesNotThrow(() => trackGoogleAdsConversion("consultation", "ST-323456"));
  assert.equal(trackGoogleAdsConversion("consultation", "ST-323456"), false);

  installTrackingWindow(() => { throw new Error("blocked"); });
  assert.doesNotThrow(() => trackGoogleAdsConversion("consultation", "ST-323457"));
  assert.equal(trackGoogleAdsConversion("consultation", "ST-323457"), false);

  delete (globalThis as { window?: unknown }).window;
  assert.doesNotThrow(() => trackGoogleAdsConversion("direct_application", "ST-323458"));
  assert.equal(trackGoogleAdsConversion("direct_application", "ST-323458"), false);
});
