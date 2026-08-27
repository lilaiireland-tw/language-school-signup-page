import type { DirectApplicationFormData } from "../types";

export function sanitizeApplicationPayload(form: DirectApplicationFormData): DirectApplicationFormData {
  if (form.serviceType === "consultation") {
    const agreements = { ...form.agreements };
    delete agreements.isic;
    return { ...form, preferredSchool: "", customSchool: "", decisionStage: "", agreements, isicInitiallyEligible: false };
  }
  return { ...form, consultationGoal: "", isicInitiallyEligible: true };
}
