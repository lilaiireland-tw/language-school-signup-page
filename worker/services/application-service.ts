import { createApplication, getApplication, listApplications, updateApplication } from "../repositories/application-repository";
import type { AdminApplicationPatch, ApplicationInput } from "../shared/types";

export async function submitApplication(db: D1Database, input: ApplicationInput, requestedId?: string) {
  const id = requestedId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedId)
    ? requestedId.toLowerCase()
    : crypto.randomUUID();
  const result = await createApplication(db, input, id, new Date().toISOString());
  return { id, duplicate: result === "duplicate" };
}

export const findApplication = getApplication;
export const findApplications = listApplications;

export async function changeApplication(db: D1Database, id: string, patch: AdminApplicationPatch) {
  return updateApplication(db, id, patch, new Date().toISOString());
}
