import * as v from "valibot";

/**
 * Schema for a single detailed validation error item returned by the API.
 */
export const apiErrorDetailsSchema = v.object({
  message: v.string(),
  path: v.array(v.union([v.string(), v.number()])),
});

/**
 * Detailed validation error information returned by the API.
 */
export type ApiErrorDetails = v.InferOutput<typeof apiErrorDetailsSchema>;

/**
 * API error code.
 */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "INVALID_REQUEST_BODY"
  | "VALIDATION_ERROR"
  | "EXECUTION_TIMEOUT"
  | "REQUEST_BODY_TOO_LARGE"
  | "QUEUE_FULL"
  | "QUEUE_TIMEOUT"
  | (string & {});

/**
 * Schema for the top-level API error response payload.
 */
export const apiErrorResponseSchema = v.object({
  code: v.string(),
  message: v.string(),
  errors: v.optional(v.array(apiErrorDetailsSchema)),
});

/**
 * API error response.
 */
export type ApiErrorResponse = {
  /**
   * Machine-readable error code.
   */
  code: ApiErrorCode;
  /**
   * Human-readable error message.
   */
  message: string;
  /**
   * Optional field-level validation errors.
   */
  errors?: ApiErrorDetails[];
};

/**
 * Error thrown for non-2xx API responses with a structured error body.
 */
export class CodizeApiError extends Error {
  /**
   * Machine-readable API error code.
   */
  readonly code: ApiErrorResponse["code"];
  /**
   * Optional field-level validation errors.
   */
  readonly errors?: ApiErrorResponse["errors"];
  /**
   * HTTP status code of the response.
   */
  readonly status: number;
  /**
   * Raw response headers.
   */
  readonly headers: Headers;

  /**
   * Creates a rich API error object.
   *
   * @param status HTTP status code.
   * @param headers Raw response headers.
   * @param response Parsed API error payload.
   */
  constructor(status: number, headers: Headers, response: ApiErrorResponse) {
    super(response.message);
    this.name = "CodizeApiError";
    this.code = response.code;
    this.errors = response.errors;
    this.status = status;
    this.headers = headers;
  }
}
