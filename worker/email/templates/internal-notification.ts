import type { ApplicationRow } from "../../shared/types.ts";
import type { RenderedEmail } from "../email-types.ts";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function renderInternalNotificationEmail(application: ApplicationRow): RenderedEmail {
  const direct = application.service_type === "direct_application";
  const school = application.preferred_school === "其他指定學校" ? application.custom_school : application.preferred_school;
  const subject = direct ? `[網站新申請] 直接報名｜${application.chinese_name}｜${application.preferred_city}｜${school}` : `[網站新申請] 一對一諮詢｜${application.chinese_name}｜${application.preferred_city}`;
  const fields = [["申請編號", application.reference_code], ["服務", application.service_type], ["姓名", application.chinese_name], ["Email", application.email], ["電話", application.phone], ["LINE", application.line_id], ["城市", application.preferred_city], ["學校", school], ["課程", application.course_type], ["預計出發", application.expected_start_month], ["課程長度", application.course_duration], ["報名準備階段", application.decision_stage], ["諮詢目標", application.consultation_goal], ["預算", application.budget_range]].filter(([, value]) => value?.trim());
  const text = fields.map(([label, value]) => `${label}：${value}`).join("\n");
  return { subject, text, html: `<div style="font-family:Arial,'Microsoft JhengHei',sans-serif;white-space:pre-line">${escapeHtml(text)}</div>` };
}
