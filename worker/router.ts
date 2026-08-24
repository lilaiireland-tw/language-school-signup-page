import { handleGetApplication, handleListApplications, handleUpdateApplication } from "./routes/admin-applications";
import { handleCreateApplication } from "./routes/applications";
import { errorResponse } from "./shared/http";

export async function routeApiRequest(request: Request, env: Cloudflare.Env): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/applications") {
    return request.method === "POST" ? handleCreateApplication(request, env) : methodNotAllowed(["POST"]);
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
