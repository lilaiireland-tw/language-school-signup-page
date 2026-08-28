import { HttpError } from "../shared/http.ts";

export const TURNSTILE_ACTION = "application_submit";
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface SiteverifyResult {
  success?: unknown;
  action?: unknown;
  hostname?: unknown;
}

function expectedHostnames(env: Cloudflare.Env): Set<string> {
  return new Set((env.TURNSTILE_HOSTNAMES ?? "").split(",").map((hostname) => hostname.trim().toLowerCase()).filter(Boolean));
}

export async function verifyTurnstile(request: Request, env: Cloudflare.Env, token: unknown, fetcher: typeof fetch = fetch): Promise<void> {
  const hostnames = expectedHostnames(env);
  if (typeof token !== "string" || token.length === 0 || token.length > 2048 || !env.TURNSTILE_SECRET || hostnames.size === 0) {
    throw new HttpError(403, "turnstile_failed", "安全驗證失敗，請重新驗證後再試。");
  }

  let result: SiteverifyResult;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetcher(SITEVERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token,
          ...(request.headers.get("CF-Connecting-IP") ? { remoteip: request.headers.get("CF-Connecting-IP")! } : {}),
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`siteverify ${response.status}`);
      result = await response.json() as SiteverifyResult;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    throw new HttpError(403, "turnstile_failed", "安全驗證暫時無法完成，請稍後再試。");
  }

  const hostname = typeof result.hostname === "string" ? result.hostname.toLowerCase() : "";
  if (result.success !== true || result.action !== TURNSTILE_ACTION || !hostnames.has(hostname)) {
    throw new HttpError(403, "turnstile_failed", "安全驗證失敗，請重新驗證後再試。");
  }
}
