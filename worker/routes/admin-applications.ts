import { changeApplication, findApplication, findApplications } from "../services/application-service";
import { isAdminAuthorized } from "../shared/auth";
import { HttpError, errorResponse, jsonResponse, readJson } from "../shared/http";
import { parseAdminPatch } from "../validation/application-schema";

async function authorize(request: Request, env: Cloudflare.Env): Promise<Response | null> {
  if (!env.ADMIN_API_TOKEN) return errorResponse(503, "admin_auth_not_configured", "管理 API 尚未設定。");
  return await isAdminAuthorized(request, env.ADMIN_API_TOKEN) ? null : errorResponse(401, "unauthorized", "未授權的管理 API 請求。");
}

export async function handleListApplications(request: Request, env: Cloudflare.Env): Promise<Response> {
  const unauthorized = await authorize(request, env);
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 100);
  const offset = Math.max(Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);
  try {
    const result = await findApplications(env.DB, {
      status: url.searchParams.get("status") || undefined,
      serviceType: url.searchParams.get("serviceType") || undefined,
      query: url.searchParams.get("q")?.trim().slice(0, 200) || undefined,
      limit, offset,
    });
    return jsonResponse({ ok: true, ...result, pagination: { limit, offset } });
  } catch (error) {
    console.error(JSON.stringify({ event: "admin_application_list_failed", error: error instanceof Error ? error.message : "unknown" }));
    return errorResponse(500, "application_list_failed", "無法取得報名清單。");
  }
}

export async function handleGetApplication(request: Request, env: Cloudflare.Env, id: string): Promise<Response> {
  const unauthorized = await authorize(request, env);
  if (unauthorized) return unauthorized;
  const application = await findApplication(env.DB, id);
  return application ? jsonResponse({ ok: true, application }) : errorResponse(404, "application_not_found", "找不到該筆報名資料。");
}

export async function handleUpdateApplication(request: Request, env: Cloudflare.Env, id: string): Promise<Response> {
  const unauthorized = await authorize(request, env);
  if (unauthorized) return unauthorized;
  try {
    const patch = parseAdminPatch(await readJson(request));
    const application = await changeApplication(env.DB, id, patch);
    return application ? jsonResponse({ ok: true, application }) : errorResponse(404, "application_not_found", "找不到該筆報名資料。");
  } catch (error) {
    if (error instanceof HttpError) return errorResponse(error.status, error.code, error.message, error.details);
    console.error(JSON.stringify({ event: "admin_application_update_failed", applicationId: id, error: error instanceof Error ? error.message : "unknown" }));
    return errorResponse(500, "application_update_failed", "無法更新報名資料。");
  }
}
