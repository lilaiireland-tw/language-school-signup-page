export function retryDelaySeconds(attempts: number): number {
  return Math.min(3600, 60 * 2 ** Math.max(0, attempts - 1));
}
