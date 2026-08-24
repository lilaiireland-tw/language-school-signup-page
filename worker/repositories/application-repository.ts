import type { AdminApplicationPatch, ApplicationInput, ApplicationRow } from "../shared/types";

const AGREEMENT_VERSION = "2026-08-24";

export async function createApplication(db: D1Database, input: ApplicationInput, id: string, now: string): Promise<"created" | "duplicate"> {
  const existing = await db.prepare("SELECT id FROM applications WHERE id = ?1").bind(id).first<{ id: string }>();
  if (existing) return "duplicate";
  const insert = db.prepare(`INSERT INTO applications (
    id, service_type, chinese_name, email, phone, line_id, current_location, preferred_city, preferred_school,
    custom_school, course_type, expected_start_month, course_duration, class_schedule, accommodation_needed,
    partner_accommodation_interest, quote_status, decision_stage, consultation_goal, budget_range, additional_notes,
    discovery_source, agreements_json, agreement_version, consented_at, utm_source, utm_medium, utm_campaign,
    utm_content, utm_term, gclid, landing_page_url, isic_initially_eligible, created_at, updated_at
  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30, ?31, ?32, ?33, ?34, ?35)`)
    .bind(id, input.serviceType, input.chineseName, input.email, input.phone, input.lineId, input.currentLocation,
      input.preferredCity, input.preferredSchool, input.customSchool, input.courseType, input.expectedStartMonth,
      input.courseDuration, input.classSchedule, input.accommodationNeeded, input.partnerAccommodationInterest,
      input.quoteStatus, input.decisionStage, input.consultationGoal, input.budgetRange, input.additionalNotes,
      input.discoverySource, JSON.stringify(input.agreements), AGREEMENT_VERSION, now, input.utmSource, input.utmMedium,
      input.utmCampaign, input.utmContent, input.utmTerm, input.gclid, input.landingPageUrl,
      input.isicInitiallyEligible ? 1 : 0, now, now);
  const jobs = (["student_email", "internal_email", "notion_sync"] as const).map((jobType) =>
    db.prepare("INSERT INTO integration_jobs (id, application_id, job_type, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)")
      .bind(crypto.randomUUID(), id, jobType, now, now));
  await db.batch([insert, ...jobs]);
  return "created";
}

export async function getApplication(db: D1Database, id: string): Promise<ApplicationRow | null> {
  return db.prepare("SELECT * FROM applications WHERE id = ?1").bind(id).first<ApplicationRow>();
}

export async function listApplications(db: D1Database, params: { status?: string; serviceType?: string; query?: string; limit: number; offset: number }) {
  const clauses: string[] = [];
  const values: string[] = [];
  if (params.status) { clauses.push(`crm_status = ?${values.length + 1}`); values.push(params.status); }
  if (params.serviceType) { clauses.push(`service_type = ?${values.length + 1}`); values.push(params.serviceType); }
  if (params.query) {
    clauses.push(`(chinese_name LIKE ?${values.length + 1} OR email LIKE ?${values.length + 2} OR phone LIKE ?${values.length + 3})`);
    const query = `%${params.query}%`;
    values.push(query, query, query);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const count = await db.prepare(`SELECT COUNT(*) AS total FROM applications ${where}`).bind(...values).first<{ total: number }>();
  const rows = await db.prepare(`SELECT * FROM applications ${where} ORDER BY created_at DESC LIMIT ?${values.length + 1} OFFSET ?${values.length + 2}`)
    .bind(...values, params.limit, params.offset).all<ApplicationRow>();
  return { applications: rows.results, total: count?.total ?? 0 };
}

export async function updateApplication(db: D1Database, id: string, patch: AdminApplicationPatch, now: string): Promise<ApplicationRow | null> {
  const columns: string[] = [];
  const values: string[] = [];
  const mappings: Array<[keyof AdminApplicationPatch, string]> = [
    ["crmStatus", "crm_status"], ["assignedTo", "assigned_to"], ["internalNotes", "internal_notes"],
    ["isicEligibilityStatus", "isic_eligibility_status"], ["isicNotes", "isic_notes"],
  ];
  for (const [key, column] of mappings) {
    if (patch[key] !== undefined) { values.push(patch[key] as string); columns.push(`${column} = ?${values.length}`); }
  }
  values.push(now, id);
  await db.prepare(`UPDATE applications SET ${columns.join(", ")}, updated_at = ?${values.length - 1} WHERE id = ?${values.length}`).bind(...values).run();
  return getApplication(db, id);
}
