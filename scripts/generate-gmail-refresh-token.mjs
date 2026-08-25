import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import process from "node:process";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000;

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

function parseDesktopCredentials(value) {
  const installed = value?.installed;
  if (!installed || typeof installed.client_id !== "string" || typeof installed.client_secret !== "string") {
    throw new Error("The credential file must contain a Google OAuth Desktop app under the 'installed' key.");
  }
  return { clientId: installed.client_id, clientSecret: installed.client_secret };
}

function safeStateMatches(actual, expected) {
  if (typeof actual !== "string") return false;
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

function successPage(response) {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  response.end("<!doctype html><meta charset=utf-8><title>Gmail OAuth complete</title><p>Authorization received. You can close this tab and return to the terminal.</p>");
}

function failurePage(response) {
  response.writeHead(400, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  response.end("<!doctype html><meta charset=utf-8><title>Gmail OAuth failed</title><p>Authorization failed. Return to the terminal for a sanitized error.</p>");
}

async function waitForAuthorizationCode(server, expectedState) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for Google authorization."));
    }, CALLBACK_TIMEOUT_MS);

    server.on("request", (request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname !== "/oauth2/callback") {
        response.writeHead(404).end();
        return;
      }

      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const oauthError = url.searchParams.get("error");
      if (!safeStateMatches(state, expectedState) || !code || oauthError) {
        clearTimeout(timeout);
        failurePage(response);
        server.close();
        reject(new Error(oauthError ? `Google authorization failed: ${oauthError}` : "OAuth callback validation failed."));
        return;
      }

      clearTimeout(timeout);
      successPage(response);
      server.close();
      resolve(code);
    });
  });
}

async function exchangeAuthorizationCode({ clientId, clientSecret, code, codeVerifier, redirectUri }) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorCode = typeof payload.error === "string" ? payload.error : "unknown_error";
    throw new Error(`Google token exchange failed (${response.status}): ${errorCode}`);
  }
  if (typeof payload.refresh_token !== "string" || payload.refresh_token.length === 0) {
    throw new Error("Google did not return a refresh token. Revoke the existing app grant and run this consent flow again.");
  }
  if (typeof payload.scope === "string") {
    const scopes = payload.scope.split(/\s+/).filter(Boolean);
    if (scopes.length !== 1 || scopes[0] !== GMAIL_SEND_SCOPE) {
      throw new Error("Google returned an unexpected OAuth scope; the token was not printed.");
    }
  }
  return payload.refresh_token;
}

async function main() {
  const credentialPath = process.argv[2];
  if (!credentialPath) {
    throw new Error("Usage: npm run gmail:authorize -- <path-to-desktop-oauth-client.json>");
  }

  const credentialJson = JSON.parse(await readFile(credentialPath, "utf8"));
  const credentials = parseDesktopCredentials(credentialJson);
  const state = base64Url(randomBytes(32));
  const codeVerifier = base64Url(randomBytes(64));
  const codeChallenge = base64Url(createHash("sha256").update(codeVerifier).digest());

  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not start the local OAuth callback server.");
  }

  const redirectUri = `http://127.0.0.1:${address.port}/oauth2/callback`;
  const authorizationUrl = new URL(AUTH_ENDPOINT);
  authorizationUrl.search = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_SEND_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    login_hint: "lilaiireland@gmail.com",
  }).toString();

  console.log("\nOpen this URL in your browser and authorize only lilaiireland@gmail.com:\n");
  console.log(authorizationUrl.toString());
  console.log("\nWaiting up to 5 minutes for the local OAuth callback...\n");

  const code = await waitForAuthorizationCode(server, state);
  const refreshToken = await exchangeAuthorizationCode({ ...credentials, code, codeVerifier, redirectUri });
  console.log("GMAIL_REFRESH_TOKEN (printed once; store it in Cloudflare Secrets now):\n");
  console.log(refreshToken);
  console.log("\nThis script did not write the refresh token to disk or print the access token.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Gmail OAuth authorization failed.");
  process.exitCode = 1;
});
