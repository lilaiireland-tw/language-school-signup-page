import type { DirectApplicationFormData } from "../types";

export type DirectApplicationReadiness = { ready: boolean; requiresConsultationReview: boolean; reasons: string[] };

export function evaluateDirectApplicationReadiness(form: DirectApplicationFormData): DirectApplicationReadiness {
  if (form.serviceType !== "direct_application") return { ready: false, requiresConsultationReview: true, reasons: ["目前選擇的是一對一諮詢"] };
  const hasCityDirection = Boolean(form.preferredCity && form.preferredCity !== "尚未確定");
  const hasSchoolDirection = Boolean(form.preferredSchool && form.preferredSchool !== "尚未確定");
  const hasDepartureDirection = Boolean(form.expectedStartMonth && form.expectedStartMonth !== "尚未確定");
  const needsFullComparison = form.decisionStage === "我仍需要完整比較不同學校或城市";
  const reasons = [
    !hasCityDirection && !hasSchoolDirection ? "城市與學校方向尚未確認" : "",
    !hasDepartureDirection ? "出發時間尚未確認" : "",
    needsFullComparison ? "仍需要完整比較不同學校或城市" : "",
  ].filter(Boolean);
  return { ready: reasons.length === 0, requiresConsultationReview: needsFullComparison || (!hasCityDirection && !hasSchoolDirection), reasons };
}
