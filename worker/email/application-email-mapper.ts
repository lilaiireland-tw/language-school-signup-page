import type { ApplicationRow } from "../shared/types.ts";
import type { StudentConfirmationEmailData } from "./email-types.ts";

function optional(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function formatDeparture(value: string): string | undefined {
  const normalized = optional(value);
  if (!normalized) return undefined;
  const match = /^(\d{4})-(\d{2})$/.exec(normalized);
  return match ? `${match[1]} 年 ${Number(match[2])} 月` : normalized;
}

function accommodationLabel(value: string): string | undefined {
  const normalized = optional(value);
  if (!normalized) return undefined;
  if (["需要", "true", "1"].includes(normalized)) return "需要住宿協助";
  if (["不需要", "false", "0"].includes(normalized)) return "目前不需要住宿協助";
  if (normalized === "尚未確定") return "尚未確定是否需要住宿協助";
  return normalized;
}

export function mapApplicationToStudentEmailData(application: ApplicationRow): StudentConfirmationEmailData {
  const direct = application.service_type === "direct_application";
  const selectedSchool = application.preferred_school === "其他指定學校" ? application.custom_school : application.preferred_school;
  return {
    studentName: optional(application.chinese_name) ?? "",
    email: application.email.trim(),
    submissionId: application.reference_code.trim(),
    serviceType: application.service_type,
    serviceTypeLabel: direct ? "語校直接報名" : "一對一語校諮詢",
    departureDate: formatDeparture(application.expected_start_month),
    cityPreference: optional(application.preferred_city),
    schoolPreference: direct ? optional(selectedSchool) : undefined,
    courseType: optional(application.course_type),
    courseLength: optional(application.course_duration),
    accommodationLabel: accommodationLabel(application.accommodation_needed),
    goalLabel: direct ? undefined : optional(application.consultation_goal),
    planStageLabel: direct ? optional(application.decision_stage) : undefined,
  };
}
