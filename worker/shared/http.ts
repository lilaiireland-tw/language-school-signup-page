export function jsonResponse(body: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(extraHeaders);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { status, headers });
}

export function errorResponse(status: number, code: string, message: string, details?: Record<string, string>, headers?: HeadersInit): Response {
  return jsonResponse({ ok: false, error: { code, message, ...(details ? { details } : {}) } }, status, headers);
}

export async function readJson(request: Request, maxBytes = 32_768): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new HttpError(415, "unsupported_media_type", "只接受 JSON 格式。");
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new HttpError(413, "payload_too_large", "請求內容過大。");
  const body = await request.arrayBuffer();
  if (body.byteLength > maxBytes) throw new HttpError(413, "payload_too_large", "請求內容過大。");
  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new HttpError(400, "invalid_json", "JSON 格式錯誤。");
  }
}

export class HttpError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details?: Record<string, string>) {
    super(message);
  }
}
