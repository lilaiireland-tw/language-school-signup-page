declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const firedEvents = new Set<string>();

export function trackEvent(event: string, payload: Record<string, unknown> = {}, onceKey?: string) {
  if (typeof window === "undefined") return;
  const key = onceKey ?? event;
  if (firedEvents.has(key)) return;
  firedEvents.add(key);
  window.dataLayer?.push({ event, ...payload });
}
