import assert from "node:assert/strict";
import test from "node:test";
import { mapApplicationToStudentEmailData } from "../worker/email/application-email-mapper.ts";
import { BRAND_LINKS } from "../worker/email/email-constants.ts";
import { renderStudentConfirmationEmail } from "../worker/email/templates/student-confirmation.ts";
import type { ApplicationRow } from "../worker/shared/types.ts";

function application(overrides: Partial<ApplicationRow> = {}): ApplicationRow {
  return {
    id: "11111111-1111-4111-8111-111111111111", reference_code: "ST-000004", service_type: "consultation",
    chinese_name: "測試同學", email: "lilaiireland@gmail.com", phone: "0900000000", line_id: "test-line",
    current_location: "台灣", preferred_city: "Dublin", preferred_school: "尚未確定", custom_school: "",
    course_type: "一般英文課程", expected_start_month: "3–6 個月內", course_duration: "25+8 課程", class_schedule: "上午",
    accommodation_needed: "需要", partner_accommodation_interest: "兩者都想了解", quote_status: "尚未取得",
    decision_stage: "", consultation_goal: "規劃 25+8 打工遊學", budget_range: "尚未確認", additional_notes: "",
    discovery_source: "Google 搜尋", agreements_json: "{}", agreement_version: "1", consented_at: "2026-08-27T00:00:00.000Z",
    utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "", utm_term: "", gclid: "", landing_page_url: "",
    isic_initially_eligible: 0, isic_eligibility_status: "pending", isic_notes: "", crm_status: "new", assigned_to: "",
    internal_notes: "", created_at: "2026-08-27T00:00:00.000Z", updated_at: "2026-08-27T00:00:00.000Z", ...overrides,
  };
}

function assertClean(rendered: { html: string; text: string }) {
  for (const output of [rendered.html, rendered.text]) assert.doesNotMatch(output, /undefined|null|\[object Object\]|�/);
}

test("consultation email contains personalized data and the booking link", () => {
  const rendered = renderStudentConfirmationEmail(mapApplicationToStudentEmailData(application()));
  assert.equal(rendered.subject, "測試同學，我們收到你的一對一語校諮詢預約了 ✨");
  assert.match(rendered.html, /Hi 測試同學，/);
  assert.match(rendered.html, /ST-000004/);
  assert.match(rendered.html, /需要住宿協助/);
  assert.match(rendered.html, /規劃 25\+8 打工遊學/);
  assert.ok(rendered.html.includes(BRAND_LINKS.consultationBooking));
  assert.ok(rendered.text.includes(BRAND_LINKS.consultationBooking));
  assert.doesNotMatch(rendered.html, /5 個工作天/);
  assertClean(rendered);
});

test("direct application email includes the five-business-day next step", () => {
  const rendered = renderStudentConfirmationEmail(mapApplicationToStudentEmailData(application({
    service_type: "direct_application", expected_start_month: "2026-10", preferred_school: "其他指定學校",
    custom_school: "測試語言學校", decision_stage: "我已確認主要學校及課程，可以直接報名", consultation_goal: "", accommodation_needed: "不需要",
  })));
  assert.match(rendered.subject, /語校報名資料/);
  assert.match(rendered.html, /2026 年 10 月/);
  assert.match(rendered.html, /測試語言學校/);
  assert.match(rendered.html, /目前不需要住宿協助/);
  assert.match(rendered.html, /5 個工作天/);
  assert.doesNotMatch(rendered.html, /calendar\.google\.com/);
  assertClean(rendered);
});

test("missing name and optional fields render safe fallbacks", () => {
  const rendered = renderStudentConfirmationEmail(mapApplicationToStudentEmailData(application({
    chinese_name: "", preferred_city: "", course_type: "", course_duration: "", accommodation_needed: "", consultation_goal: "",
  })));
  assert.equal(rendered.subject, "哩來愛爾蘭｜已收到你的一對一語校諮詢預約");
  assert.match(rendered.html, /Hi，/);
  assertClean(rendered);
});

test("HTML is UTF-8, table based, responsive, and keeps required links", () => {
  const rendered = renderStudentConfirmationEmail(mapApplicationToStudentEmailData(application()));
  assert.match(rendered.html, /<meta charset="UTF-8">/);
  assert.match(rendered.html, /max-width:640px/);
  assert.match(rendered.html, /<table role="presentation"/);
  assert.ok(rendered.html.includes(BRAND_LINKS.website));
  assert.ok(rendered.html.includes(BRAND_LINKS.instagram));
  assert.match(rendered.text, /一起把夢，過成生活 ✨/);
});
