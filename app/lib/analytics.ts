import type { ServiceType } from "./types";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (
      command: "event",
      eventName: "conversion",
      parameters: { send_to: string; transaction_id: string },
    ) => void;
  }
}

const firedEvents = new Set<string>();
export const GOOGLE_ADS_CONVERSION_SEND_TO: Readonly<Record<ServiceType, string>> = {
  direct_application: "AW-17610996814/MeKhCKz2-e0cEM74yc1B",
  consultation: "AW-17610996814/b4bzCNrO-u0cEM74yc1B",
};

export function trackEvent(event: string, payload: Record<string, unknown> = {}, onceKey?: string) {
  if (typeof window === "undefined") return;
  const key = onceKey ?? event;
  if (firedEvents.has(key)) return;
  firedEvents.add(key);
  window.dataLayer?.push({ event, ...payload });
}

export function trackGoogleAdsConversion(serviceType: ServiceType, applicationId: string): boolean {
  if (typeof window === "undefined" || !/^ST-\d{6,}$/.test(applicationId)) return false;

  const sendTo = GOOGLE_ADS_CONVERSION_SEND_TO[serviceType];
  const transactionId = `${serviceType}:${applicationId}`;
  const onceKey = `google-ads:${transactionId}`;
  if (firedEvents.has(onceKey)) return false;

  try {
    if (window.sessionStorage.getItem(onceKey) === "sent") return false;
  } catch {
    // Tracking can still proceed when browser storage is unavailable.
  }

  if (typeof window.gtag !== "function") return false;
  try {
    window.gtag("event", "conversion", {
      send_to: sendTo,
      transaction_id: transactionId,
    });
  } catch {
    return false;
  }
  firedEvents.add(onceKey);

  try {
    window.sessionStorage.setItem(onceKey, "sent");
  } catch {
    // The in-memory guard still prevents React re-render duplicates.
  }

  return true;
}
