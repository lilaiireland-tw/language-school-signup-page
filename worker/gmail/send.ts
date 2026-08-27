import type { ApplicationRow, IntegrationJobType } from "../shared/types.ts";
import { IntegrationError } from "../queue/integration-error.ts";
import { getGmailAccessToken, type HttpFetch } from "./oauth.ts";

const encoder = new TextEncoder();
const EXPECTED_GMAIL_SENDER = "lilaiireland@gmail.com";

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function encodeMimeHeader(value: string): string {
  return `=?UTF-8?B?${base64(encoder.encode(value))}?=`;
}

export function encodeBase64Url(value: string): string {
  return base64(encoder.encode(value)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function emailContent(application: ApplicationRow, jobType: IntegrationJobType, env: Cloudflare.Env) {
  const direct = application.service_type === "direct_application";
  if (jobType === "student_email") {
    const subject = direct ? "哩來已收到你的愛爾蘭語校報名" : "哩來已收到你的一對一諮詢需求";
    const text = `你好 ${application.chinese_name}，\n\n我們已收到你的${direct ? "語校報名" : "諮詢需求"}。\n申請編號：${application.reference_code}\n預計出發：${application.expected_start_month}\n城市：${application.preferred_city}\n\n我們會盡快與你聯絡。`;
    return { to: application.email, subject, text };
  }
  const subject = direct
    ? `[網站新名單] 直接報名｜${application.chinese_name}｜${application.preferred_city}｜${application.preferred_school}`
    : `[網站新名單] 一對一諮詢｜${application.chinese_name}｜${application.preferred_city}`;
  const text = `申請編號：${application.reference_code}\n服務：${application.service_type}\n姓名：${application.chinese_name}\nEmail：${application.email}\n電話：${application.phone}\nLINE：${application.line_id}\n城市：${application.preferred_city}\n學校：${application.preferred_school || application.custom_school}\n課程：${application.course_type}\n預計出發：${application.expected_start_month}\n課程長度：${application.course_duration}\n預算：${application.budget_range}`;
  return { to: env.INTERNAL_NOTIFICATION_EMAIL, subject, text };
}

export function buildMimeMessage(to: string, subject: string, text: string, sender: string, replyTo: string): string {
  const boundary = `lilai-${crypto.randomUUID()}`;
  const html = `<div style="font-family:sans-serif;white-space:pre-line">${escapeHtml(text)}</div>`;
  const senderNameHeader = encodeMimeHeader("哩來愛爾蘭");
  const subjectHeader = encodeMimeHeader(subject);
  return [
    `From: ${senderNameHeader} <${sender}>`, `To: ${to}`, `Reply-To: ${replyTo}`,
    `Subject: ${subjectHeader}`, "MIME-Version: 1.0", `Content-Type: multipart/alternative; boundary="${boundary}"`, "",
    `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", base64(encoder.encode(text)),
    `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", base64(encoder.encode(html)),
    `--${boundary}--`, "",
  ].join("\r\n");
}

export async function sendGmailMessage(raw: string, accessToken: string, fetcher: HttpFetch = fetch): Promise<string> {
  let response: Response;
  try {
    response = await fetcher("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ raw }),
    });
  } catch {
    throw new IntegrationError("Gmail send network request failed", true);
  }

  let payload: { id?: unknown };
  try {
    payload = await response.json();
  } catch {
    throw new IntegrationError(`Gmail send returned invalid JSON (${response.status})`, response.status >= 500 || response.status === 429);
  }
  if (!response.ok || typeof payload.id !== "string" || payload.id.length === 0) {
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw new IntegrationError(`Gmail send failed (${response.status})`, retryable);
  }
  return payload.id;
}

export async function sendApplicationEmail(
  application: ApplicationRow,
  jobType: "student_email" | "internal_email",
  env: Cloudflare.Env,
  fetcher: HttpFetch = fetch,
): Promise<string> {
  if (env.GMAIL_SENDER_EMAIL !== EXPECTED_GMAIL_SENDER) {
    throw new IntegrationError("Gmail sender email is misconfigured", false);
  }
  const accessToken = await getGmailAccessToken({
    clientId: env.GMAIL_CLIENT_ID,
    clientSecret: env.GMAIL_CLIENT_SECRET,
    refreshToken: env.GMAIL_REFRESH_TOKEN,
  }, fetcher);
  const content = emailContent(application, jobType, env);
  const mime = buildMimeMessage(content.to, content.subject, content.text, env.GMAIL_SENDER_EMAIL, env.EMAIL_REPLY_TO);
  return sendGmailMessage(encodeBase64Url(mime), accessToken, fetcher);
}
