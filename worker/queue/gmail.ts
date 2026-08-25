import type { ApplicationRow, IntegrationJobType } from "../shared/types";
import { IntegrationError } from "./integration-error";

const encoder = new TextEncoder();

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64Url(bytes: Uint8Array): string {
  return base64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function encodeUtf8(value: string): string {
  return base64Url(encoder.encode(value));
}

function pemBytes(pem: string): ArrayBuffer {
  const normalized = pem.replaceAll("\\n", "\n");
  const base64 = normalized.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
}

async function gmailAccessToken(env: Cloudflare.Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeUtf8(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = encodeUtf8(JSON.stringify({
    iss: env.GMAIL_SERVICE_ACCOUNT_EMAIL,
    sub: env.GMAIL_SENDER_EMAIL,
    scope: "https://www.googleapis.com/auth/gmail.send",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey("pkcs8", pemBytes(env.GMAIL_PRIVATE_KEY), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  } catch {
    throw new IntegrationError("Gmail service-account private key is invalid", false);
  }
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(unsigned));
  const assertion = `${unsigned}.${base64Url(new Uint8Array(signature))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const payload = await response.json<{ access_token?: string; error?: string; error_description?: string }>();
  if (!response.ok || !payload.access_token) {
    const retryable = response.status === 429 || response.status >= 500;
    throw new IntegrationError(`Gmail OAuth failed (${response.status}): ${payload.error ?? "unknown"} ${payload.error_description ?? ""}`.trim(), retryable);
  }
  return payload.access_token;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function emailContent(application: ApplicationRow, jobType: IntegrationJobType, env: Cloudflare.Env) {
  const direct = application.service_type === "direct_application";
  if (jobType === "student_email") {
    const subject = direct ? "哩來已收到你的愛爾蘭語校報名" : "哩來已收到你的一對一諮詢需求";
    const text = `你好 ${application.chinese_name}，\n\n我們已收到你的${direct ? "語校報名" : "諮詢需求"}。\n申請編號：${application.id}\n預計出發：${application.expected_start_month}\n城市：${application.preferred_city}\n\n我們會盡快與你聯絡。`;
    return { to: application.email, subject, text };
  }
  const subject = direct
    ? `[網站新名單] 直接報名｜${application.chinese_name}｜${application.preferred_city}｜${application.preferred_school}`
    : `[網站新名單] 一對一諮詢｜${application.chinese_name}｜${application.preferred_city}`;
  const text = `申請編號：${application.id}\n服務：${application.service_type}\n姓名：${application.chinese_name}\nEmail：${application.email}\n電話：${application.phone}\nLINE：${application.line_id}\n城市：${application.preferred_city}\n學校：${application.preferred_school || application.custom_school}\n課程：${application.course_type}\n預計出發：${application.expected_start_month}\n課程長度：${application.course_duration}\n預算：${application.budget_range}`;
  return { to: env.INTERNAL_NOTIFICATION_EMAIL, subject, text };
}

function mimeMessage(to: string, subject: string, text: string, env: Cloudflare.Env): string {
  const boundary = `lilai-${crypto.randomUUID()}`;
  const html = `<div style="font-family:sans-serif;white-space:pre-line">${escapeHtml(text)}</div>`;
  const subjectHeader = `=?UTF-8?B?${base64(encoder.encode(subject))}?=`;
  return [
    `From: 哩來愛爾蘭 <${env.GMAIL_SENDER_EMAIL}>`, `To: ${to}`, `Reply-To: ${env.EMAIL_REPLY_TO}`,
    `Subject: ${subjectHeader}`, "MIME-Version: 1.0", `Content-Type: multipart/alternative; boundary="${boundary}"`, "",
    `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", base64(encoder.encode(text)),
    `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", base64(encoder.encode(html)),
    `--${boundary}--`, "",
  ].join("\r\n");
}

export async function sendApplicationEmail(application: ApplicationRow, jobType: "student_email" | "internal_email", env: Cloudflare.Env): Promise<string> {
  const token = await gmailAccessToken(env);
  const content = emailContent(application, jobType, env);
  const raw = base64Url(encoder.encode(mimeMessage(content.to, content.subject, content.text, env)));
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(env.GMAIL_SENDER_EMAIL)}/messages/send`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  const payload = await response.json<{ id?: string; error?: { message?: string } }>();
  if (!response.ok || !payload.id) {
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw new IntegrationError(`Gmail send failed (${response.status}): ${payload.error?.message ?? "unknown"}`, retryable);
  }
  return payload.id;
}
