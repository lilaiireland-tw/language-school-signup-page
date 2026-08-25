import assert from "node:assert/strict";
import test from "node:test";
import { getGmailAccessToken, type HttpFetch } from "../worker/gmail/oauth.ts";
import { buildMimeMessage, encodeBase64Url, sendGmailMessage } from "../worker/gmail/send.ts";
import { IntegrationError } from "../worker/queue/integration-error.ts";
import { retryDelaySeconds } from "../worker/queue/retry.ts";

const credentials = { clientId: "test-client", clientSecret: "test-secret", refreshToken: "test-refresh" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("OAuth token response is parsed and request uses refresh_token grant", async () => {
  let requestBody = "";
  const fetcher: HttpFetch = async (input, init) => {
    assert.equal(input, "https://oauth2.googleapis.com/token");
    assert.equal(init?.method, "POST");
    requestBody = String(init?.body);
    return jsonResponse({ access_token: "short-lived-access-token", expires_in: 3600, token_type: "Bearer" });
  };

  const token = await getGmailAccessToken(credentials, fetcher);
  assert.equal(token, "short-lived-access-token");
  const params = new URLSearchParams(requestBody);
  assert.equal(params.get("client_id"), credentials.clientId);
  assert.equal(params.get("client_secret"), credentials.clientSecret);
  assert.equal(params.get("refresh_token"), credentials.refreshToken);
  assert.equal(params.get("grant_type"), "refresh_token");
});

test("OAuth permanent configuration failures do not retry", async () => {
  for (const error of ["invalid_client", "invalid_grant", "unauthorized_client"]) {
    const fetcher: HttpFetch = async () => jsonResponse({ error, error_description: "sensitive provider detail" }, 400);
    await assert.rejects(
      getGmailAccessToken(credentials, fetcher),
      (failure: unknown) => failure instanceof IntegrationError
        && failure.retryable === false
        && failure.message.includes(error)
        && !failure.message.includes("sensitive provider detail"),
    );
  }
});

test("OAuth temporary provider and network failures retry", async () => {
  const unavailable: HttpFetch = async () => jsonResponse({ error: "temporarily_unavailable" }, 503);
  await assert.rejects(getGmailAccessToken(credentials, unavailable), (failure: unknown) => failure instanceof IntegrationError && failure.retryable);

  const networkFailure: HttpFetch = async () => { throw new Error("socket included secret-like diagnostics"); };
  await assert.rejects(
    getGmailAccessToken(credentials, networkFailure),
    (failure: unknown) => failure instanceof IntegrationError && failure.retryable && !failure.message.includes("secret-like"),
  );
});

test("Gmail success uses users/me and returns the provider message ID", async () => {
  const fetcher: HttpFetch = async (input, init) => {
    assert.equal(input, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { raw: "encoded-message" });
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer test-access-token");
    return jsonResponse({ id: "gmail-message-id" });
  };
  assert.equal(await sendGmailMessage("encoded-message", "test-access-token", fetcher), "gmail-message-id");
});

test("Gmail 401 and 403 authorization failures do not retry", async () => {
  for (const status of [401, 403]) {
    const fetcher: HttpFetch = async () => jsonResponse({ error: { message: "authorization rejected" } }, status);
    await assert.rejects(
      sendGmailMessage("raw", "token", fetcher),
      (failure: unknown) => failure instanceof IntegrationError && failure.retryable === false && failure.message.includes(String(status)),
    );
  }
});

test("Gmail 429 and 5xx failures use the existing retry path", async () => {
  for (const status of [429, 500, 503]) {
    const fetcher: HttpFetch = async () => jsonResponse({ error: { message: "temporary failure" } }, status);
    await assert.rejects(
      sendGmailMessage("raw", "token", fetcher),
      (failure: unknown) => failure instanceof IntegrationError && failure.retryable === true,
    );
  }
});

test("complete email content is encoded as unpadded base64url", () => {
  const source = "From: 測試 <sender@example.com>\r\nSubject: + / =\r\n\r\n內容";
  const encoded = encodeBase64Url(source);
  assert.doesNotMatch(encoded, /[+/=]/);
  const standard = encoded.replaceAll("-", "+").replaceAll("_", "/");
  const decoded = Buffer.from(standard, "base64").toString("utf8");
  assert.equal(decoded, source);
});

test("non-ASCII sender display name uses an RFC 2047 UTF-8 encoded word", () => {
  const mime = buildMimeMessage(
    "recipient@example.com",
    "測試主旨",
    "測試內容",
    "lilaiireland@gmail.com",
    "lilaiireland@gmail.com",
  );
  const expectedName = Buffer.from("哩來愛爾蘭", "utf8").toString("base64");
  assert.equal(mime.split("\r\n")[0], `From: =?UTF-8?B?${expectedName}?= <lilaiireland@gmail.com>`);
  assert.doesNotMatch(mime, /^From: 哩來愛爾蘭/m);
});

test("integration retry delay remains exponential and capped", () => {
  assert.equal(retryDelaySeconds(1), 60);
  assert.equal(retryDelaySeconds(2), 120);
  assert.equal(retryDelaySeconds(3), 240);
  assert.equal(retryDelaySeconds(20), 3600);
});
