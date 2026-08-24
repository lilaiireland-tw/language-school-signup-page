import type { DirectApplicationFormData, DirectApplicationSubmission } from "./types";

export const DIRECT_APPLICATION_NOTIFICATION_EMAIL = "lilaiireland@gmail.com";

// Future API integration layer: Alex can replace this mock with a POST to the production endpoint.
// The backend should notify DIRECT_APPLICATION_NOTIFICATION_EMAIL and/or create the CRM record.
export async function submitDirectApplication(
  form: DirectApplicationFormData,
): Promise<{ ok: true; submissionId: string; submission: DirectApplicationSubmission }> {
  const submissionId = crypto.randomUUID();
  const response = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": submissionId },
    body: JSON.stringify(form),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(result?.error?.message ?? "報名資料送出失敗，請稍後再試。");
  }
  return {
    ok: true,
    submissionId,
    submission: {
      ...form,
      isicEligibilityStatus: "pending",
      isicNotes: "",
    },
  };
}
