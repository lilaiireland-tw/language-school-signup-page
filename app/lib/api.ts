import type { DirectApplicationFormData, DirectApplicationSubmission } from "./types";

export const DIRECT_APPLICATION_NOTIFICATION_EMAIL = "lilaiireland@gmail.com";

// Future API integration layer: Alex can replace this mock with a POST to the production endpoint.
// The backend should notify DIRECT_APPLICATION_NOTIFICATION_EMAIL and/or create the CRM record.
export async function submitDirectApplication(
  form: DirectApplicationFormData,
): Promise<{ ok: true; submission: DirectApplicationSubmission }> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    ok: true,
    submission: {
      ...form,
      isicEligibilityStatus: "pending",
      isicNotes: "",
    },
  };
}
