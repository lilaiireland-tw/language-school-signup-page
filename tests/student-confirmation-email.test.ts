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
  for (const output of [rendered.html, rendered.text]) {
    assert.match(output, /一對一語校諮詢需先支付/);
    assert.match(output, /NT\$800/);
    assert.match(output, /成功報名學校後可抵訂金/);
    assert.match(output, /抵達愛爾蘭後，此筆諮詢費將全額退回/);
    assert.match(output, /保留 (?:<strong>)?24 小時/);
    assert.match(output, /完成付款後預約才正式成立/);
    assert.match(output, /逾期未付款將自動釋出/);
    assert.match(output, /合作金庫（006）三民分行/);
    assert.match(output, /0590717154926/);
    assert.match(output, /築夢愛爾國際留遊學顧問/);
    assert.match(output, /回覆此封 Email 並附上轉帳證明/);
  }
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
  for (const output of [rendered.html, rendered.text]) {
    assert.doesNotMatch(output, /方案與付款規則|0590717154926|轉帳證明|保留 (?:<strong>)?24 小時/);
  }
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
  assert.match(rendered.html, /width="600"/);
  assert.match(rendered.html, /max-width:600px/);
  assert.match(rendered.html, /<table role="presentation"/);
  assert.match(rendered.html, /bgcolor="#7C8F6E"/);
  assert.match(rendered.html, /bgcolor="#EFF3EA"/);
  assert.match(rendered.html, /bgcolor="#3A4A32"/);
  assert.match(rendered.html, /Arial,'Microsoft JhengHei',sans-serif/);
  assert.ok(rendered.html.includes(BRAND_LINKS.googleReviews));
  for (const output of [rendered.html, rendered.text]) {
    assert.match(output, /Alex (?:&amp;|&) Arsha｜Lilai Ireland 哩來愛爾蘭 共同創辦人/);
    assert.match(output, /陪你把「出發」這件事，變得沒那麼可怕。/);
    assert.match(output, /哩來 Google 評論 ⭐ 5\.0/);
    assert.match(output, /一起把夢，過成生活 🌍✨/);
  }
});
