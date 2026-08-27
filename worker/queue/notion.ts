import type { ApplicationRow } from "../shared/types";
import { IntegrationError } from "./integration-error";

interface NotionPageResponse { id?: string; results?: Array<{ id: string }> }

async function notionRequest(env: Cloudflare.Env, path: string, body: unknown): Promise<NotionPageResponse> {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.NOTION_TOKEN}`,
      "content-type": "application/json",
      "notion-version": env.NOTION_VERSION,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json<NotionPageResponse & { message?: string }>();
  if (!response.ok) {
    const retryable = response.status === 408 || response.status === 409 || response.status === 429 || response.status >= 500;
    throw new IntegrationError(`Notion request failed (${response.status}): ${payload.message ?? "unknown"}`, retryable);
  }
  return payload;
}

export async function syncApplicationToNotion(application: ApplicationRow, env: Cloudflare.Env): Promise<string> {
  const existing = await notionRequest(env, `/databases/${env.NOTION_DATABASE_ID}/query`, {
    filter: { property: "Submission ID", rich_text: { equals: application.reference_code } },
    page_size: 1,
  });
  if (existing.results?.[0]?.id) return existing.results[0].id;

  const legacy = await notionRequest(env, `/databases/${env.NOTION_DATABASE_ID}/query`, {
    filter: { property: "Submission ID", rich_text: { equals: application.id } },
    page_size: 1,
  });
  if (legacy.results?.[0]?.id) return legacy.results[0].id;

  const page = await notionRequest(env, "/pages", {
    parent: { database_id: env.NOTION_DATABASE_ID },
    properties: {
      Name: { title: [{ text: { content: application.chinese_name } }] },
      "Submission ID": { rich_text: [{ text: { content: application.reference_code } }] },
      "Service Type": { select: { name: application.service_type } },
      Email: { email: application.email },
      Phone: { phone_number: application.phone },
      "Submitted At": { date: { start: application.created_at } },
    },
  });
  if (!page.id) throw new IntegrationError("Notion create page returned no page ID", true);
  return page.id;
}
