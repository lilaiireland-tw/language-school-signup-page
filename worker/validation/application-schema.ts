import { HttpError } from "../shared/http.ts";
import type { AdminApplicationPatch, ApplicationInput, CrmStatus, IsicEligibilityStatus, ServiceType } from "../shared/types.ts";

type UnknownRecord = Record<string, unknown>;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CRM_STATUSES = new Set<CrmStatus>(["new", "contacted", "qualified", "quoted", "deposit_pending", "enrolled", "closed_lost"]);
const ISIC_STATUSES = new Set<IsicEligibilityStatus>(["pending", "eligible", "requires_documents", "not_eligible"]);

function object(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(422, "validation_failed", "請求資料格式錯誤。");
  return value as UnknownRecord;
}

function stringField(source: UnknownRecord, field: string, options: { required?: boolean; max?: number } = {}): string {
  const value = source[field];
  const normalized = typeof value === "string" ? value.trim() : "";
  if (options.required && !normalized) throw new HttpError(422, "validation_failed", "請完成所有必填欄位。", { [field]: "此欄位為必填" });
  if (normalized.length > (options.max ?? 500)) throw new HttpError(422, "validation_failed", "欄位內容過長。", { [field]: `最多 ${options.max ?? 500} 個字元` });
  return normalized;
}

function safeLandingPageUrl(value: string): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

export function parseApplicationInput(value: unknown): ApplicationInput {
  const source = object(value);
  const serviceType = stringField(source, "serviceType", { required: true }) as ServiceType;
  if (serviceType !== "direct_application" && serviceType !== "consultation") throw new HttpError(422, "validation_failed", "無效的需求類型。");
  const email = stringField(source, "email", { required: true, max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new HttpError(422, "validation_failed", "請輸入有效的 Email。", { email: "Email 格式錯誤" });

  const agreementSource = object(source.agreements);
  const agreementEntries = Object.entries(agreementSource);
  if (!agreementEntries.length || agreementEntries.some(([, checked]) => checked !== true)) throw new HttpError(422, "validation_failed", "請勾選所有必要同意事項。");
  if (serviceType === "direct_application" && agreementSource.isic !== true) throw new HttpError(422, "validation_failed", "請確認 ISIC 贈禮與官方審核說明。", { isic: "此欄位為必填" });
  const agreements = Object.fromEntries(agreementEntries.map(([key]) => [key, true])) as Record<string, true>;

  const input: ApplicationInput = {
    serviceType,
    chineseName: stringField(source, "chineseName", { required: true, max: 120 }), email,
    phone: stringField(source, "phone", { required: true, max: 80 }),
    lineId: stringField(source, "lineId", { max: 120 }),
    currentLocation: stringField(source, "currentLocation", { required: true, max: 120 }),
    preferredCity: stringField(source, "preferredCity", { required: true, max: 120 }),
    preferredSchool: stringField(source, "preferredSchool", { required: serviceType === "direct_application", max: 200 }),
    customSchool: stringField(source, "customSchool", { max: 200 }),
    courseType: stringField(source, "courseType", { required: true, max: 200 }),
    expectedStartMonth: stringField(source, "expectedStartMonth", { required: true, max: 80 }),
    courseDuration: stringField(source, "courseDuration", { required: true, max: 80 }),
    classSchedule: stringField(source, "classSchedule", { max: 80 }),
    accommodationNeeded: stringField(source, "accommodationNeeded", { required: true, max: 80 }),
    partnerAccommodationInterest: stringField(source, "partnerAccommodationInterest", { max: 200 }),
    quoteStatus: stringField(source, "quoteStatus", { max: 120 }),
    decisionStage: stringField(source, "decisionStage", { required: serviceType === "direct_application", max: 200 }),
    consultationGoal: stringField(source, "consultationGoal", { required: serviceType === "consultation", max: 200 }),
    budgetRange: stringField(source, "budgetRange", { required: true, max: 200 }),
    additionalNotes: stringField(source, "additionalNotes", { max: 4000 }),
    discoverySource: stringField(source, "discoverySource", { max: 200 }), agreements,
    utmSource: stringField(source, "utmSource", { max: 300 }), utmMedium: stringField(source, "utmMedium", { max: 300 }),
    utmCampaign: stringField(source, "utmCampaign", { max: 300 }), utmContent: stringField(source, "utmContent", { max: 300 }),
    utmTerm: stringField(source, "utmTerm", { max: 300 }), gclid: stringField(source, "gclid", { max: 500 }),
    landingPageUrl: safeLandingPageUrl(stringField(source, "landingPageUrl", { max: 1000 })),
    // Legacy D1 field name retained for compatibility; this means the direct-application ISIC gift is included,
    // not that the student has passed official ISIC eligibility review.
    isicInitiallyEligible: source.isicInitiallyEligible === true,
  };
  if (serviceType === "consultation") {
    input.preferredSchool = "";
    input.customSchool = "";
    input.decisionStage = "";
    input.isicInitiallyEligible = false;
    delete input.agreements.isic;
  } else {
    input.consultationGoal = "";
    input.isicInitiallyEligible = true;
  }
  if (input.preferredSchool === "其他指定學校" && !input.customSchool) throw new HttpError(422, "validation_failed", "請填寫指定學校。", { customSchool: "此欄位為必填" });
  if (input.accommodationNeeded !== "不需要" && !input.partnerAccommodationInterest) throw new HttpError(422, "validation_failed", "請完成住宿需求。", { partnerAccommodationInterest: "此欄位為必填" });
  return input;
}

export function parseAdminPatch(value: unknown): AdminApplicationPatch {
  const source = object(value);
  const allowed = new Set(["crmStatus", "assignedTo", "internalNotes", "isicEligibilityStatus", "isicNotes"]);
  if (Object.keys(source).some((key) => !allowed.has(key))) throw new HttpError(422, "validation_failed", "包含不允許修改的欄位。");
  const patch: AdminApplicationPatch = {};
  if (source.crmStatus !== undefined) {
    const status = stringField(source, "crmStatus") as CrmStatus;
    if (!CRM_STATUSES.has(status)) throw new HttpError(422, "validation_failed", "無效的 CRM 狀態。");
    patch.crmStatus = status;
  }
  if (source.isicEligibilityStatus !== undefined) {
    const status = stringField(source, "isicEligibilityStatus") as IsicEligibilityStatus;
    if (!ISIC_STATUSES.has(status)) throw new HttpError(422, "validation_failed", "無效的 ISIC 狀態。");
    patch.isicEligibilityStatus = status;
  }
  if (source.assignedTo !== undefined) patch.assignedTo = stringField(source, "assignedTo", { max: 120 });
  if (source.internalNotes !== undefined) patch.internalNotes = stringField(source, "internalNotes", { max: 8000 });
  if (source.isicNotes !== undefined) patch.isicNotes = stringField(source, "isicNotes", { max: 4000 });
  if (!Object.keys(patch).length) throw new HttpError(422, "validation_failed", "請提供至少一個可更新欄位。");
  return patch;
}
