export interface StudentConfirmationEmailData {
  studentName: string;
  email: string;
  submissionId: string;
  serviceType: "direct_application" | "consultation";
  serviceTypeLabel: string;
  departureDate?: string;
  cityPreference?: string;
  schoolPreference?: string;
  courseType?: string;
  courseLength?: string;
  accommodationLabel?: string;
  goalLabel?: string;
  planStageLabel?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}
