import type { ApplicationRow, IntegrationJobType } from "../shared/types.ts";
import { IntegrationError } from "../queue/integration-error.ts";
import { mapApplicationToStudentEmailData } from "../email/application-email-mapper.ts";
import { SENDER_DISPLAY_NAME } from "../email/email-constants.ts";
import { renderInternalNotificationEmail } from "../email/templates/internal-notification.ts";
import { renderStudentConfirmationEmail } from "../email/templates/student-confirmation.ts";
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

function emailContent(application: ApplicationRow, jobType: IntegrationJobType, env: Cloudflare.Env) {
  if (jobType === "student_email") {
    return { to: application.email, ...renderStudentConfirmationEmail(mapApplicationToStudentEmailData(application)) };
  }
  return { to: env.INTERNAL_NOTIFICATION_EMAIL, ...renderInternalNotificationEmail(application) };
}

export function buildMimeMessage(to: string, subject: string, text: string, sender: string, replyTo: string, html = ""): string {
  const boundary = `lilai-${crypto.randomUUID()}`;
  return [
    `From: ${encodeMimeHeader(SENDER_DISPLAY_NAME)} <${sender}>`, `To: ${to}`, `Reply-To: ${replyTo}`,
    `Subject: ${encodeMimeHeader(subject)}`, "MIME-Version: 1.0", `Content-Type: multipart/alternative; boundary="${boundary}"`, "",
    `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", base64(encoder.encode(text)),
    `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", base64(encoder.encode(html || `<div>${text}</div>`)),
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
    throw new IntegrationError("Gmail send network request failed", true, { code: "gmail_send_network" });
  }
  let payload: { id?: unknown };
  try {
    payload = await response.json();
  } catch {
    throw new IntegrationError(`Gmail send returned invalid JSON (${response.status})`, response.status >= 500 || response.status === 429, {
      code: "gmail_send_invalid_json",
      httpStatus: response.status,
    });
  }
  if (!response.ok || typeof payload.id !== "string" || payload.id.length === 0) {
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw new IntegrationError(`Gmail send failed (${response.status})`, retryable, {
      code: "gmail_send_failed",
      httpStatus: response.status,
    });
  }
  return payload.id;
}

export async function sendApplicationEmail(application: ApplicationRow, jobType: "student_email" | "internal_email", env: Cloudflare.Env, fetcher: HttpFetch = fetch): Promise<string> {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER_EMAIL } = env;
  if (GMAIL_SENDER_EMAIL !== EXPECTED_GMAIL_SENDER) throw new IntegrationError("Gmail sender email is misconfigured", false, { code: "gmail_sender_misconfigured" });
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    throw new IntegrationError("Gmail OAuth is not configured", false, { code: "gmail_oauth_not_configured" });
  }
  const accessToken = await getGmailAccessToken({
    clientId: GMAIL_CLIENT_ID,
    clientSecret: GMAIL_CLIENT_SECRET,
    refreshToken: GMAIL_REFRESH_TOKEN,
  }, fetcher);
  const content = emailContent(application, jobType, env);
  const mime = buildMimeMessage(content.to, content.subject, content.text, GMAIL_SENDER_EMAIL, env.EMAIL_REPLY_TO, content.html);
  return sendGmailMessage(encodeBase64Url(mime), accessToken, fetcher);
}
