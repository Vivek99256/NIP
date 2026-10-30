export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(message: string = "Authentication required") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message: string = "Access denied: insufficient permissions") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(message: string = "Resource not found") {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static conflict(message: string = "Conflict with existing resource") {
    return new AppError(message, 409, "CONFLICT");
  }

  static tooManyRequests(message: string = "Too many requests. Please try again later.") {
    return new AppError(message, 429, "RATE_LIMIT_EXCEEDED");
  }

  static internal(message: string = "An unexpected error occurred. Please try again later.") {
    return new AppError(message, 500, "INTERNAL_SERVER_ERROR");
  }
}

export function sanitizeError(error: unknown): { message: string; code: string; statusCode: number } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  // Handle Zod validation errors cleanly
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues: Array<{ message: string; path: (string | number)[] }> }).issues;
    const summary = issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    return {
      message: `Validation failed: ${summary}`,
      code: "VALIDATION_ERROR",
      statusCode: 400,
    };
  }

  // Default fallback to avoid leaking database or internal stack traces
  return {
    message: "A server error occurred. Please try again later.",
    code: "INTERNAL_SERVER_ERROR",
    statusCode: 500,
  };
}
