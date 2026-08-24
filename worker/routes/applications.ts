import { submitApplication } from "../services/application-service";
import { HttpError, errorResponse, jsonResponse, readJson } from "../shared/http";
import { parseApplicationInput } from "../validation/application-schema";

export async function handleCreateApplication(request: Request, env: Cloudflare.Env): Promise<Response> {
  try {
    const input = parseApplicationInput(await readJson(request));
    const result = await submitApplication(env.DB, input, request.headers.get("Idempotency-Key") ?? undefined);
    return jsonResponse({ ok: true, submissionId: result.id, duplicate: result.duplicate }, result.duplicate ? 200 : 201);
  } catch (error) {
    if (error instanceof HttpError) return errorResponse(error.status, error.code, error.message, error.details);
    console.error(JSON.stringify({ event: "application_create_failed", error: error instanceof Error ? error.message : "unknown" }));
    return errorResponse(500, "application_create_failed", "目前無法儲存報名資料，請稍後再試。");
  }
}
