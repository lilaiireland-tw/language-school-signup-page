export type ServiceType = "direct_application" | "consultation";
export type CrmStatus = "new" | "contacted" | "qualified" | "quoted" | "deposit_pending" | "enrolled" | "closed_lost";
export type IsicEligibilityStatus = "pending" | "eligible" | "requires_documents" | "not_eligible";

export interface ApplicationInput {
  serviceType: ServiceType;
  chineseName: string;
  email: string;
  phone: string;
  lineId: string;
  currentLocation: string;
  preferredCity: string;
  preferredSchool: string;
  customSchool: string;
  courseType: string;
  expectedStartMonth: string;
  courseDuration: string;
  classSchedule: string;
  accommodationNeeded: string;
  partnerAccommodationInterest: string;
  quoteStatus: string;
  decisionStage: string;
  consultationGoal: string;
  budgetRange: string;
  additionalNotes: string;
  discoverySource: string;
  agreements: Record<string, true>;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  gclid: string;
  landingPageUrl: string;
  isicInitiallyEligible: boolean;
}

export interface ApplicationRow {
  id: string;
  service_type: ServiceType;
  chinese_name: string;
  email: string;
  phone: string;
  line_id: string;
  current_location: string;
  preferred_city: string;
  preferred_school: string;
  custom_school: string;
  course_type: string;
  expected_start_month: string;
  course_duration: string;
  class_schedule: string;
  accommodation_needed: string;
  partner_accommodation_interest: string;
  quote_status: string;
  decision_stage: string;
  consultation_goal: string;
  budget_range: string;
  additional_notes: string;
  discovery_source: string;
  agreements_json: string;
  agreement_version: string;
  consented_at: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  gclid: string;
  landing_page_url: string;
  isic_initially_eligible: number;
  isic_eligibility_status: IsicEligibilityStatus;
  isic_notes: string;
  crm_status: CrmStatus;
  assigned_to: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

export interface AdminApplicationPatch {
  crmStatus?: CrmStatus;
  assignedTo?: string;
  internalNotes?: string;
  isicEligibilityStatus?: IsicEligibilityStatus;
  isicNotes?: string;
}

export type IntegrationJobType = "student_email" | "internal_email" | "notion_sync";
export type IntegrationJobStatus = "pending" | "processing" | "succeeded" | "failed" | "dead_letter";

export interface IntegrationJobRow {
  id: string;
  application_id: string;
  job_type: IntegrationJobType;
  status: IntegrationJobStatus;
  attempts: number;
  last_error: string;
  next_retry_at: string | null;
  provider_message_id: string | null;
  notion_page_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface IntegrationQueueMessage {
  applicationId: string;
}
