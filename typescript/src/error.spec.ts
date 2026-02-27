import { describe, expect, it } from "vitest";
import { CodizeApiError } from "./error";

describe("CodizeApiError", () => {
  const makeHeaders = (entries: Record<string, string> = {}) =>
    new Headers(entries);

  it("sets name to 'CodizeApiError'", () => {
    const error = new CodizeApiError(401, makeHeaders(), {
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
    expect(error.name).toBe("CodizeApiError");
  });

  it("sets message from response.error.message", () => {
    const error = new CodizeApiError(401, makeHeaders(), {
      error: { code: "UNAUTHORIZED", message: "Invalid API key" },
    });
    expect(error.message).toBe("Invalid API key");
  });

  it("sets code from response.error.code", () => {
    const error = new CodizeApiError(401, makeHeaders(), {
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("sets status from the first argument", () => {
    const error = new CodizeApiError(429, makeHeaders(), {
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });
    expect(error.status).toBe(429);
  });

  it("sets headers from the second argument", () => {
    const headers = makeHeaders({ "x-request-id": "abc123" });
    const error = new CodizeApiError(500, headers, {
      error: { code: "INTERNAL_ERROR", message: "Server error" },
    });
    expect(error.headers).toBe(headers);
    expect(error.headers.get("x-request-id")).toBe("abc123");
  });

  it("sets errors when provided", () => {
    const errors = [{ message: "field required", path: ["files", 0] }];
    const error = new CodizeApiError(422, makeHeaders(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        errors,
      },
    });
    expect(error.errors).toEqual(errors);
  });

  it("leaves errors undefined when not provided", () => {
    const error = new CodizeApiError(401, makeHeaders(), {
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
    expect(error.errors).toBeUndefined();
  });

  it("is an instance of Error", () => {
    const error = new CodizeApiError(500, makeHeaders(), {
      error: { code: "INTERNAL_ERROR", message: "Oops" },
    });
    expect(error).toBeInstanceOf(Error);
  });
});
