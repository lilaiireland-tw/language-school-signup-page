import { CONSULTATION_TERMS, formatTwd } from "../../../app/lib/commercial-terms.ts";
import { BRAND_LINKS, BRAND_NAME, BRAND_TAGLINE, CONSULTATION_PAYMENT_DETAILS, JOINT_SIGNATURE_NAME, JOINT_SIGNATURE_TAGLINE } from "../email-constants.ts";
import type { RenderedEmail, StudentConfirmationEmailData } from "../email-types.ts";

const font = "Arial,'Microsoft JhengHei',sans-serif";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function present(value: string | undefined): value is string { return Boolean(value?.trim()); }

function summaryRows(data: StudentConfirmationEmailData): Array<[string, string]> {
  const direct = data.serviceType === "direct_application";
  const rows: Array<[string, string | undefined]> = [
    ["申請編號", data.submissionId], [direct ? "預計入學" : "預計出發", data.departureDate],
    ["偏好城市", data.cityPreference], [direct ? "報名學校" : "感興趣的課程", direct ? data.schoolPreference : data.courseType],
    ["課程安排", [direct ? data.courseType : undefined, data.courseLength].filter(present).join("／") || undefined], ["住宿需求", data.accommodationLabel],
  ];
  return rows.filter((row): row is [string, string] => present(row[1])).slice(0, 6);
}

function renderRows(rows: Array<[string, string]>): string {
  return rows.map(([label, value], index) => `<tr><td style="padding:${index ? "10px" : "0"} 0 0;color:#888888;font-size:14px;line-height:1.8;vertical-align:top;width:108px">${escapeHtml(label)}</td><td style="padding:${index ? "10px" : "0"} 0 0;color:#333333;font-size:14px;font-weight:bold;line-height:1.8;vertical-align:top">${escapeHtml(value)}</td></tr>`).join("");
}

function contentCard(title: string, body: string): string {
  return `<tr><td style="padding:8px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d8ded0"><tr><td bgcolor="#EFF3EA" style="padding:10px 18px;font-size:15px;font-weight:bold;color:#4b5d3f">📌 ${escapeHtml(title)}</td></tr><tr><td style="padding:14px 18px;font-size:14px;line-height:1.8;color:#333333">${body}</td></tr></table></td></tr>`;
}

function ctaBlock(body: string): string {
  return `<tr><td style="padding:8px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #3A4A32"><tr><td bgcolor="#3A4A32" style="padding:16px 18px;font-size:14px;line-height:1.8;color:#ffffff">${body}</td></tr></table></td></tr>`;
}

export function renderStudentConfirmationEmail(data: StudentConfirmationEmailData): RenderedEmail {
  const direct = data.serviceType === "direct_application";
  const name = data.studentName.trim();
  const greeting = name ? `Hi ${name}，` : "Hi，";
  const subject = name ? `${name}，我們收到你的${direct ? "語校報名資料" : "一對一語校諮詢預約"}了 ✨` : `哩來愛爾蘭｜已收到你的${direct ? "語校報名資料" : "一對一語校諮詢預約"}`;
  const rows = summaryRows(data);
  const introHtml = direct ? "我們已經收到你提交的語校報名資料了！<br><br>接下來，我們會先確認你填寫的學校、課程、開課時間與住宿需求，並整理後續報名需要確認或補充的項目。" : "我們已經收到你的一對一語校諮詢預約了！<br><br>接下來，我們會先看看你填寫的出發時間、城市、課程方向與目前最想了解的問題，讓後續討論可以更聚焦，也更貼近你真正需要的規劃。";
  const introText = introHtml.replaceAll("<br><br>", "\n\n").replaceAll("<br>", "\n");
  const whyTitle = direct ? "收到資料後，我們會做什麼？" : "我們會先幫你準備什麼？";
  const whyBody = direct ? "我們會先檢查你提交的基本資料，確認學校、課程、入學時間與住宿需求是否完整。如果有需要補充或確認的地方，我們會再與你聯絡。在資料確認完成前，你不需要重複填寫表單。" : "我們會先整理你提交的資料，了解你目前的出發時間、預算方向、學校或城市偏好，讓正式討論時可以直接從最重要的問題開始。";
  const focusTitle = direct ? "你目前的報名進度" : "這次最希望一起討論的是";
  const focusValue = direct ? data.planStageLabel : data.goalLabel;
  const consultationFee = formatTwd(CONSULTATION_TERMS.priceTwd);
  const paymentBody = `一對一語校諮詢需先支付 <strong>${consultationFee}</strong> 諮詢費。成功報名學校後可抵訂金；抵達愛爾蘭後，此筆諮詢費將全額退回。<br><br>選擇諮詢時段後，該時段將保留 <strong>${CONSULTATION_TERMS.bookingHoldHours} 小時</strong>；完成付款後預約才正式成立，逾期未付款將自動釋出。<br><br><strong style="color:#4b5d3f">匯款資訊</strong><br>銀行：${escapeHtml(CONSULTATION_PAYMENT_DETAILS.bankName)}（${CONSULTATION_PAYMENT_DETAILS.bankCode}）${escapeHtml(CONSULTATION_PAYMENT_DETAILS.branchName)}<br>帳號：${CONSULTATION_PAYMENT_DETAILS.accountNumber}<br>戶名：${escapeHtml(CONSULTATION_PAYMENT_DETAILS.accountName)}<br><br>完成匯款後，請直接回覆此封 Email 並附上轉帳證明，以便我們核對款項並確認預約。`;
  const nextBody = direct ? `我們確認基本資料後，會在 <strong>5 個工作天內</strong>，將學校的正式報名表寄到你填寫的 Email。收到後，請依照表單內容填寫完整資料並按信件說明回傳。` : `請先完成上述付款，再透過下方連結選擇適合你的日期與時間。<br><br><a href="${BRAND_LINKS.consultationBooking}" style="display:inline-block;padding:11px 16px;background:#ffffff;color:#3A4A32;font-weight:bold;text-decoration:none">選擇一對一諮詢時段</a><br><br>如果目前沒有適合的時段，或預約時遇到問題，可以直接回覆這封 Email。`;
  const focusCard = focusValue ? contentCard(focusTitle, `<strong style="color:#4b5d3f">「${escapeHtml(focusValue)}」</strong>`) : "";
  const paymentCard = direct ? "" : contentCard("方案與付款規則", paymentBody);
  const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;padding:0;background-color:#f5f5f0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0"><tr><td align="center" style="padding:20px 0"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;font-family:${font};color:#333333;background-color:#ffffff"><tr><td bgcolor="#7C8F6E" style="padding:28px 32px"><span style="color:#ffffff;font-size:22px;font-weight:bold">${BRAND_NAME}</span><br><span style="color:#eaf0e3;font-size:13px">${BRAND_TAGLINE}</span></td></tr><tr><td style="padding:28px 32px 8px 32px;font-size:15px;line-height:1.8"><strong style="color:#4b5d3f">${escapeHtml(greeting)}</strong><br><br>${introHtml}</td></tr>${contentCard(`你的${direct ? "報名" : "諮詢"}資料`, `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderRows(rows)}</table>`)}${contentCard(whyTitle, whyBody)}${focusCard}${paymentCard}${ctaBlock(`<strong style="font-size:15px">${direct ? "接下來的報名步驟" : "預約你的一對一諮詢時間"}</strong><br><br>${nextBody}`)}<tr><td style="padding:16px 32px 8px 32px;font-size:14px;line-height:1.8">如果你的出發時間、學校選擇或其他規劃有更新，也可以直接回覆這封 Email 告訴我們。<br><br>謝謝你把愛爾蘭的語校規劃交給哩來，我們會依照你提交的資料整理下一步。<br><br>${BRAND_NAME}<br>${BRAND_TAGLINE}</td></tr><tr><td style="padding:8px 32px 32px 32px;font-size:14px;line-height:1.8;border-top:1px solid #eaeaea">${escapeHtml(JOINT_SIGNATURE_NAME)}<br><span style="font-size:13px;color:#888888">${escapeHtml(JOINT_SIGNATURE_TAGLINE)}｜<a href="${BRAND_LINKS.googleReviews}" style="color:#888888">哩來 Google 評論 ⭐ 5.0</a></span></td></tr></table></td></tr></table></body></html>`;
  const plainRows = rows.map(([label, value]) => `${label}：${value}`).join("\n");
  const paymentText = `方案與付款規則\n\n一對一語校諮詢需先支付 ${consultationFee} 諮詢費。成功報名學校後可抵訂金；抵達愛爾蘭後，此筆諮詢費將全額退回。\n\n選擇諮詢時段後，該時段將保留 ${CONSULTATION_TERMS.bookingHoldHours} 小時；完成付款後預約才正式成立，逾期未付款將自動釋出。\n\n匯款資訊\n銀行：${CONSULTATION_PAYMENT_DETAILS.bankName}（${CONSULTATION_PAYMENT_DETAILS.bankCode}）${CONSULTATION_PAYMENT_DETAILS.branchName}\n帳號：${CONSULTATION_PAYMENT_DETAILS.accountNumber}\n戶名：${CONSULTATION_PAYMENT_DETAILS.accountName}\n\n完成匯款後，請直接回覆此封 Email 並附上轉帳證明，以便我們核對款項並確認預約。`;
  const nextText = direct ? "接下來的報名步驟\n\n我們確認基本資料後，會在 5 個工作天內，將學校的正式報名表寄到你填寫的 Email。收到後，請依照表單內容填寫完整資料並按信件說明回傳。" : `預約你的一對一諮詢時間\n\n${paymentText}\n\n請先完成付款，再透過以下連結選擇適合你的日期與時間：\n${BRAND_LINKS.consultationBooking}\n\n如果目前沒有適合的時段，或預約時遇到問題，可以直接回覆這封 Email。`;
  const focusText = focusValue ? `\n\n${focusTitle}\n「${focusValue}」` : "";
  const text = `${greeting}\n\n${introText}\n\n你的${direct ? "報名" : "諮詢"}資料\n\n${plainRows}\n\n${whyTitle}\n\n${whyBody}${focusText}\n\n${nextText}\n\n如果你的出發時間、學校選擇或其他規劃有更新，也可以直接回覆這封 Email 告訴我們。\n\n謝謝你把愛爾蘭的語校規劃交給哩來，我們會依照你提交的資料整理下一步。\n\n${BRAND_NAME}\n${BRAND_TAGLINE}\n\n${JOINT_SIGNATURE_NAME}\n${JOINT_SIGNATURE_TAGLINE}｜哩來 Google 評論 ⭐ 5.0\n${BRAND_LINKS.googleReviews}`;
  return { subject, html, text };
}
