import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDirectApplicationReadiness } from "../app/lib/application/readiness.ts";
import { sanitizeApplicationPayload } from "../app/lib/application/sanitize.ts";
import { BRAND_LINKS } from "../app/lib/brand-links.ts";
import { getSchoolOptionsForCity, partnerSchools, visiblePartnerSchools } from "../app/lib/schools.ts";
import type { DirectApplicationFormData } from "../app/lib/types.ts";
import { parseApplicationInput } from "../worker/validation/application-schema.ts";

function form(overrides: Partial<DirectApplicationFormData> = {}): DirectApplicationFormData {
  return {
    serviceType: "direct_application", chineseName: "測試", email: "test@example.com", phone: "0900000000", lineId: "",
    currentLocation: "台灣", preferredCity: "Dublin", preferredSchool: "ISI Dublin", customSchool: "", courseType: "25+8 長期語言課程",
    expectedStartMonth: "2027-01", courseDuration: "25+8 課程", classSchedule: "上午", accommodationNeeded: "不需要",
    partnerAccommodationInterest: "", quoteStatus: "尚未取得", decisionStage: "我已確認主要學校及課程，可以直接報名",
    consultationGoal: "stale consultation value", budgetRange: "尚未確認", additionalNotes: "", discoverySource: "", agreements: { "agreement-0": true, isic: true },
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
