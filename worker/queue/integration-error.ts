export class IntegrationError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "IntegrationError";
    this.retryable = retryable;
  }
}

export function sanitizedError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return "Unknown integration error";
}
