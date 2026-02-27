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
  | "INTERNAL_ERROR"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | (string & {});

/**
 * Schema for the top-level API error response payload.
 */
export const apiErrorResponseSchema = v.object({
  error: v.object({
    code: v.string(),
    message: v.string(),
    errors: v.optional(v.array(apiErrorDetailsSchema)),
  }),
});

/**
 * API error response.
 */
export type ApiErrorResponse = {
  error: {
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
};

/**
 * Error thrown for non-2xx API responses with a structured error body.
 */
export class CodizeApiError extends Error {
  /**
   * Machine-readable API error code.
   */
  readonly code: ApiErrorResponse["error"]["code"];
  /**
   * Optional field-level validation errors.
   */
  readonly errors?: ApiErrorResponse["error"]["errors"];
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
    super(response.error.message);
    this.name = "CodizeApiError";
    this.code = response.error.code;
    this.message = response.error.message;
    this.errors = response.error.errors;
    this.status = status;
    this.headers = headers;
  }
}
