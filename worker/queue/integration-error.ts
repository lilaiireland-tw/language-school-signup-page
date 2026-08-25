export class IntegrationError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = "IntegrationError";
  }
}

export function sanitizedError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return "Unknown integration error";
}
