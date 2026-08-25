import { IntegrationError } from "../queue/integration-error.ts";

export interface GmailOAuthCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export type HttpFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface TokenResponse {
  access_token?: unknown;
  error?: unknown;
}

const PERMANENT_OAUTH_ERRORS = new Set(["invalid_client", "invalid_grant", "unauthorized_client"]);

function oauthFailure(status: number, errorCode: string): IntegrationError {
  const retryable = status === 408 || status === 429 || status >= 500 || !PERMANENT_OAUTH_ERRORS.has(errorCode) && status < 400;
  return new IntegrationError(`Gmail OAuth failed (${status}): ${errorCode || "unknown_error"}`, retryable);
}

export async function getGmailAccessToken(
  credentials: GmailOAuthCredentials,
  fetcher: HttpFetch = fetch,
): Promise<string> {
  let response: Response;
  try {
    response = await fetcher("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: "refresh_token",
      }),
    });
  } catch {
    throw new IntegrationError("Gmail OAuth network request failed", true);
  }

  let payload: TokenResponse;
  try {
    payload = await response.json<TokenResponse>();
  } catch {
    throw new IntegrationError(`Gmail OAuth returned invalid JSON (${response.status})`, response.status >= 500 || response.status === 429);
  }

  if (!response.ok) {
    throw oauthFailure(response.status, typeof payload.error === "string" ? payload.error : "unknown_error");
  }
  if (typeof payload.access_token !== "string" || payload.access_token.length === 0) {
    throw new IntegrationError("Gmail OAuth response did not include an access token", true);
  }
  return payload.access_token;
}
