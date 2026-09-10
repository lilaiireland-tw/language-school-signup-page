export class IntegrationError extends Error {
  readonly retryable: boolean;
  readonly code: string;
  readonly httpStatus: number | null;

  constructor(message: string, retryable: boolean, details: { code?: string; httpStatus?: number | null } = {}) {
    super(message);
    this.name = "IntegrationError";
    this.retryable = retryable;
    this.code = details.code ?? "integration_error";
    this.httpStatus = details.httpStatus ?? null;
  }
}

export function sanitizedError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return "Unknown integration error";
}
