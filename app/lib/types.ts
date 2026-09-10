export type IsicEligibilityStatus =
  | "pending"
  | "eligible"
  | "requires_documents"
  | "not_eligible";

export interface IsicCRMFields {
  isicEligibilityStatus: IsicEligibilityStatus;
  isicNotes?: string;
}

export type ServiceType = "direct_application" | "consultation";

export interface DirectApplicationFormData {
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
  agreements: Record<string, boolean>;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  gclid: string;
  landingPageUrl: string;
  isicInitiallyEligible: boolean;
}

export interface DirectApplicationSubmission extends DirectApplicationFormData, IsicCRMFields {}
