import type { DirectApplicationFormData, DirectApplicationSubmission } from "./types";
import { APPLICATION_API_PATH } from "./site-paths";

export const DIRECT_APPLICATION_NOTIFICATION_EMAIL = "lilaiireland@gmail.com";

// Future API integration layer: Alex can replace this mock with a POST to the production endpoint.
// The backend should notify DIRECT_APPLICATION_NOTIFICATION_EMAIL and/or create the CRM record.
export async function submitDirectApplication(
  form: DirectApplicationFormData,
  turnstileToken: string,
): Promise<{ ok: true; submissionId: string; submission: DirectApplicationSubmission }> {
  const submissionId = crypto.randomUUID();
  const response = await fetch(APPLICATION_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": submissionId },
    body: JSON.stringify({ ...form, turnstileToken }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(result?.error?.message ?? "報名資料送出失敗，請稍後再試。");
  }
  const result = await response.json() as { submissionId?: unknown };
  if (typeof result.submissionId !== "string" || !/^ST-\d{6,}$/.test(result.submissionId)) {
    throw new Error("報名已送出，但申請編號格式不正確，請聯絡哩來愛爾蘭確認。");
  }
  return {
    ok: true,
    submissionId: result.submissionId,
    submission: {
      ...form,
      isicEligibilityStatus: "pending",
      isicNotes: "",
    },
  };
}
