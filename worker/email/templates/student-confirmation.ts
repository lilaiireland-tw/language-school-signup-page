import { CONSULTATION_TERMS, formatTwd } from "../../../app/lib/commercial-terms.ts";
import { BRAND_LINKS, BRAND_NAME, BRAND_TAGLINE, CONSULTATION_PAYMENT_DETAILS } from "../email-constants.ts";
import type { RenderedEmail, StudentConfirmationEmailData } from "../email-types.ts";

const font = "Arial,'Noto Sans TC','Microsoft JhengHei',sans-serif";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function present(value: string | undefined): value is string {
  return Boolean(value?.trim());
}

function summaryRows(data: StudentConfirmationEmailData): Array<[string, string]> {
  const direct = data.serviceType === "direct_application";
  const rows: Array<[string, string | undefined]> = [
    ["申請編號", data.submissionId],
    [direct ? "預計入學" : "預計出發", data.departureDate],
    ["偏好城市", data.cityPreference],
    [direct ? "報名學校" : "感興趣的課程", direct ? data.schoolPreference : data.courseType],
    ["課程安排", [direct ? data.courseType : undefined, data.courseLength].filter(present).join("／") || undefined],
    ["住宿需求", data.accommodationLabel],
  ];
  return rows.filter((row): row is [string, string] => present(row[1])).slice(0, 6);
}

function renderRows(rows: Array<[string, string]>): string {
  return rows.map(([label, value], index) => `<tr><td style="padding:${index ? "12px" : "0"} 0 0;color:#66756d;font-size:14px;line-height:1.5;vertical-align:top;width:112px;">${escapeHtml(label)}</td><td style="padding:${index ? "12px" : "0"} 0 0;color:#26352e;font-size:15px;font-weight:700;line-height:1.5;vertical-align:top;">${escapeHtml(value)}</td></tr>`).join("");
}

export function renderStudentConfirmationEmail(data: StudentConfirmationEmailData): RenderedEmail {
  const direct = data.serviceType === "direct_application";
  const name = data.studentName.trim();
  const greeting = name ? `Hi ${name}，` : "Hi，";
  const subject = name
    ? `${name}，我們收到你的${direct ? "語校報名資料" : "一對一語校諮詢預約"}了 ✨`
    : `哩來愛爾蘭｜已收到你的${direct ? "語校報名資料" : "一對一語校諮詢預約"}`;
  const rows = summaryRows(data);
  const intro = direct
    ? "我們已經收到你提交的語校報名資料了！\n\n接下來，我們會先確認你填寫的學校、課程、開課時間與住宿需求，並整理後續報名需要確認或補充的項目。"
    : "我們已經收到你的一對一語校諮詢預約了！\n\n接下來，我們會先看看你填寫的出發時間、城市、課程方向與目前最想了解的問題，讓後續討論可以更聚焦，也更貼近你真正需要的規劃。";
  const whyTitle = direct ? "收到資料後，我們會做什麼？" : "我們會先幫你準備什麼？";
  const whyBody = direct
    ? "我們會先檢查你提交的基本資料，確認學校、課程、入學時間與住宿需求是否完整。如果有需要補充或確認的地方，我們會再與你聯絡。在資料確認完成前，你不需要重複填寫表單。"
    : "我們會先整理你提交的資料，了解你目前的出發時間、預算方向、學校或城市偏好，讓正式討論時可以直接從最重要的問題開始。";
  const focusTitle = direct ? "你目前的報名進度" : "這次最希望一起討論的是";
  const focusValue = direct ? data.planStageLabel : data.goalLabel;
  const consultationFee = formatTwd(CONSULTATION_TERMS.priceTwd);
  const paymentDetailsHtml = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;border-radius:8px;background:#f7faf8;"><tr><td style="padding:20px;color:#26352e;"><h3 style="margin:0 0 12px;color:#124e38;font-size:17px;line-height:1.4;">方案與付款規則</h3><p style="margin:0;font-size:15px;line-height:1.75;">一對一語校諮詢需先支付 <strong>${consultationFee}</strong> 諮詢費。成功報名學校後可抵訂金；抵達愛爾蘭後，此筆諮詢費將全額退回。</p><p style="margin:12px 0 0;font-size:15px;line-height:1.75;">選擇諮詢時段後，該時段將保留 <strong>${CONSULTATION_TERMS.bookingHoldHours} 小時</strong>；完成付款後預約才正式成立，逾期未付款將自動釋出。</p><div style="margin-top:18px;padding-top:16px;border-top:1px solid #bfdccb;"><div style="margin-bottom:8px;color:#124e38;font-size:15px;font-weight:700;">匯款資訊</div><div style="font-size:15px;line-height:1.8;">銀行：${escapeHtml(CONSULTATION_PAYMENT_DETAILS.bankName)}（${CONSULTATION_PAYMENT_DETAILS.bankCode}）${escapeHtml(CONSULTATION_PAYMENT_DETAILS.branchName)}<br>帳號：${CONSULTATION_PAYMENT_DETAILS.accountNumber}<br>戶名：${escapeHtml(CONSULTATION_PAYMENT_DETAILS.accountName)}</div></div><p style="margin:16px 0 0;color:#34483e;font-size:14px;line-height:1.75;">完成匯款後，請直接回覆此封 Email 並附上轉帳證明，以便我們核對款項並確認預約。</p></td></tr></table>`;
  const nextHtml = direct
    ? `<h2 style="margin:0 0 12px;color:#fff;font-size:20px;line-height:1.4;">接下來的報名步驟</h2><p style="margin:0;color:#f3fbf6;font-size:16px;line-height:1.8;">我們確認基本資料後，會在 <strong>5 個工作天內</strong>，將學校的正式報名表寄到你填寫的 Email。收到後，請依照表單內容填寫完整的報名資料，並按照信件中的說明回傳給我們。</p>`
    : `<h2 style="margin:0 0 12px;color:#fff;font-size:20px;line-height:1.4;">預約你的一對一諮詢時間</h2><p style="margin:0 0 20px;color:#f3fbf6;font-size:16px;line-height:1.8;">請點擊下方按鈕，選擇適合你的日期與時間。我們會依照你提供的資料準備這次諮詢。</p>${paymentDetailsHtml}<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="border-radius:8px;background:#fff8e8;"><a href="${BRAND_LINKS.consultationBooking}" style="display:block;padding:14px 18px;color:#124e38;font-size:16px;font-weight:700;line-height:1.4;text-align:center;text-decoration:none;">選擇一對一諮詢時段</a></td></tr></table><p style="margin:16px 0 0;color:#dceee4;font-size:14px;line-height:1.7;">如果目前沒有適合的時段，或預約時遇到問題，可以直接回覆這封 Email 與我們聯絡。</p>`;
  const focusHtml = focusValue ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-radius:10px;background:#f7faf8;"><tr><td style="padding:20px 22px;"><div style="color:#66756d;font-size:14px;line-height:1.5;">${focusTitle}</div><div style="margin-top:7px;color:#124e38;font-size:17px;font-weight:700;line-height:1.65;">「${escapeHtml(focusValue)}」</div></td></tr></table>` : "";

  const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;padding:0;background:#f4f7f5;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f5;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:14px;overflow:hidden;font-family:${font};"><tr><td style="padding:30px 24px;background:#176b4a;text-align:center;"><div style="color:#fff;font-size:23px;font-weight:700;line-height:1.4;">${BRAND_NAME}</div><div style="margin-top:6px;color:#fff8e8;font-size:14px;line-height:1.5;">${BRAND_TAGLINE}</div></td></tr><tr><td style="padding:30px 24px;color:#26352e;font-size:16px;line-height:1.85;"><p style="margin:0 0 18px;font-weight:700;">${escapeHtml(greeting)}</p><p style="margin:0;white-space:pre-line;">${escapeHtml(intro)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:26px;border:1px solid #bfdccb;border-radius:10px;"><tr><td style="padding:22px;"><h2 style="margin:0 0 18px;color:#176b4a;font-size:19px;line-height:1.4;">你的${direct ? "報名" : "諮詢"}資料</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${renderRows(rows)}</table></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border:1px solid #bfdccb;border-radius:10px;background:#edf7f1;"><tr><td style="padding:22px;"><h2 style="margin:0 0 10px;color:#176b4a;font-size:19px;line-height:1.4;">${whyTitle}</h2><p style="margin:0;color:#34483e;font-size:15px;line-height:1.8;">${whyBody}</p></td></tr></table>${focusHtml}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-radius:10px;background:#124e38;"><tr><td style="padding:24px 22px;">${nextHtml}</td></tr></table><p style="margin:26px 0 0;">如果你的出發時間、學校選擇或其他規劃有更新，也可以直接回覆這封 Email 告訴我們。</p><p style="margin:18px 0 0;">謝謝你把愛爾蘭的語校規劃交給哩來。<br>我們會依照你提交的資料整理下一步。</p><p style="margin:24px 0 0;">${BRAND_NAME}<br><span style="color:#176b4a;">${BRAND_TAGLINE}</span></p></td></tr><tr><td style="padding:22px 24px;background:#edf7f1;text-align:center;color:#66756d;font-size:13px;line-height:1.7;"><div style="color:#34483e;font-weight:700;">Alex &amp; Arsha｜Lilai Ireland 哩來愛爾蘭 共同創辦人</div><div>陪你把「準備出發」這件事，變得更清楚、更安心。</div><div style="margin-top:12px;"><a href="${BRAND_LINKS.website}" style="color:#176b4a;">官方網站</a><span>　｜　</span><a href="${BRAND_LINKS.instagram}" style="color:#176b4a;">Instagram</a></div></td></tr></table></td></tr></table></body></html>`;
  const plainRows = rows.map(([label, value]) => `${label}：${value}`).join("\n");
  const paymentDetailsText = `方案與付款規則\n\n一對一語校諮詢需先支付 ${consultationFee} 諮詢費。成功報名學校後可抵訂金；抵達愛爾蘭後，此筆諮詢費將全額退回。\n\n選擇諮詢時段後，該時段將保留 ${CONSULTATION_TERMS.bookingHoldHours} 小時；完成付款後預約才正式成立，逾期未付款將自動釋出。\n\n匯款資訊\n銀行：${CONSULTATION_PAYMENT_DETAILS.bankName}（${CONSULTATION_PAYMENT_DETAILS.bankCode}）${CONSULTATION_PAYMENT_DETAILS.branchName}\n帳號：${CONSULTATION_PAYMENT_DETAILS.accountNumber}\n戶名：${CONSULTATION_PAYMENT_DETAILS.accountName}\n\n完成匯款後，請直接回覆此封 Email 並附上轉帳證明，以便我們核對款項並確認預約。`;
  const nextText = direct
    ? "接下來的報名步驟\n\n我們確認基本資料後，會在 5 個工作天內，將學校的正式報名表寄到你填寫的 Email。\n收到後，請依照表單內容填寫完整的報名資料，並按照信件中的說明回傳給我們。"
    : `預約你的一對一諮詢時間\n\n${paymentDetailsText}\n\n請透過以下連結選擇適合你的日期與時間：\n${BRAND_LINKS.consultationBooking}\n\n如果目前沒有適合的時段，或預約時遇到問題，可以直接回覆這封 Email 與我們聯絡。`;
  const focusText = focusValue ? `\n\n${focusTitle}\n「${focusValue}」` : "";
  const text = `${greeting}\n\n${intro}\n\n你的${direct ? "報名" : "諮詢"}資料\n\n${plainRows}\n\n${whyTitle}\n\n${whyBody}${focusText}\n\n${nextText}\n\n如果你的出發時間、學校選擇或其他規劃有更新，也可以直接回覆這封 Email 告訴我們。\n\n謝謝你把愛爾蘭的語校規劃交給哩來。\n我們會依照你提交的資料整理下一步。\n\n${BRAND_NAME}\n${BRAND_TAGLINE}\n\nAlex & Arsha｜Lilai Ireland 哩來愛爾蘭 共同創辦人\n陪你把「準備出發」這件事，變得更清楚、更安心。\n\n官方網站：${BRAND_LINKS.website}\nInstagram：${BRAND_LINKS.instagram}`;
  return { subject, html, text };
}
