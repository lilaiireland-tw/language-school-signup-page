/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { routeApiRequest } from "./router";
import { errorResponse } from "./shared/http";
import { enqueueDueIntegrationJobs, handleIntegrationQueue } from "./queue/consumer";

type ImagesOutputFormat = "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif";

function imagesOutputFormat(format: string): ImagesOutputFormat {
  return (["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"] as const).find((candidate) => candidate === format) ?? "image/webp";
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    try {
      const apiResponse = await routeApiRequest(request, env);
      if (apiResponse) return apiResponse;
    } catch (error) {
      console.error(JSON.stringify({ event: "api_request_failed", path: url.pathname, error: error instanceof Error ? error.message : "unknown" }));
      return errorResponse(500, "internal_error", "伺服器發生錯誤，請稍後再試。");
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format: imagesOutputFormat(format), quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
  async queue(batch: MessageBatch<unknown>, env: Cloudflare.Env): Promise<void> {
    await handleIntegrationQueue(batch, env);
  },
  async scheduled(_controller: ScheduledController, env: Cloudflare.Env): Promise<void> {
    await enqueueDueIntegrationJobs(env);
  },
} satisfies ExportedHandler<Cloudflare.Env>;

export default worker;
