import { handleGetApplication, handleListApplications, handleUpdateApplication } from "./routes/admin-applications";
import { handleCreateApplication } from "./routes/applications";
import { errorResponse, jsonResponse } from "./shared/http";
import { TURNSTILE_ACTION } from "./security/turnstile";

const APP_BASE_PATH = "/language-school-signup";

function stripAppBasePath(pathname: string): string {
  if (pathname === APP_BASE_PATH) return "/";
  return pathname.startsWith(`${APP_BASE_PATH}/`) ? pathname.slice(APP_BASE_PATH.length) : pathname;
}

export async function routeApiRequest(request: Request, env: Cloudflare.Env): Promise<Response | null> {
  const originalPathname = new URL(request.url).pathname;
  const hasAppBasePath = originalPathname === APP_BASE_PATH || originalPathname.startsWith(`${APP_BASE_PATH}/`);
  const pathname = stripAppBasePath(originalPathname);
  if (pathname === "/api/turnstile-config") {
    if (request.method !== "GET") return methodNotAllowed(["GET"]);
    return env.TURNSTILE_SITE_KEY
      ? jsonResponse({ siteKey: env.TURNSTILE_SITE_KEY, action: TURNSTILE_ACTION })
      : errorResponse(503, "turnstile_not_configured", "安全驗證尚未設定");
  }
  if (pathname === "/api/applications") {
    return request.method === "POST" ? handleCreateApplication(request, env) : methodNotAllowed(["POST"]);
  }
  if (hasAppBasePath) {
    return pathname.startsWith("/api/") ? errorResponse(404, "api_not_found", "API endpoint 不存在") : null;
  }
  if (pathname === "/api/admin/applications") {
    return request.method === "GET" ? handleListApplications(request, env) : methodNotAllowed(["GET"]);
  }
  const match = pathname.match(/^\/api\/admin\/applications\/([0-9a-f-]{36})$/i);
  if (match) {
    if (request.method === "GET") return handleGetApplication(request, env, match[1]);
    if (request.method === "PATCH") return handleUpdateApplication(request, env, match[1]);
    return methodNotAllowed(["GET", "PATCH"]);
  }
  return pathname.startsWith("/api/") ? errorResponse(404, "api_not_found", "API endpoint 不存在。") : null;
}

function methodNotAllowed(methods: string[]): Response {
  return errorResponse(405, "method_not_allowed", "HTTP method 不允許。", undefined, { Allow: methods.join(", ") });
}
