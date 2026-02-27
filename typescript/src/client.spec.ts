import { describe, expect, it, vi } from "vitest";
import { CodizeClient } from "./client";
import { CodizeApiError } from "./error";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeJsonResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const makeTextResponse = (body: string, status: number): Response =>
  new Response(body, { status });

const sampleRunResult = {
  stdout: "Hello\n",
  stderr: "",
  output: "Hello\n",
  exitCode: 0,
};

const sampleRequest = {
  language: "python" as const,
  files: [{ name: "main.py", content: 'print("Hello")' }],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CodizeClient", () => {
  describe("constructor", () => {
    it("exposes a sandbox.execute method", () => {
      const client = new CodizeClient({ apiKey: "key", fetchFn: vi.fn() });
      expect(typeof client.sandbox.execute).toBe("function");
    });
  });

  describe("sandbox.execute", () => {
    // ----- Request construction -----

    describe("request", () => {
      it("calls the correct URL", async () => {
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse({ compile: null, run: sampleRunResult }),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        await client.sandbox.execute(sampleRequest);

        const url = fetchFn.mock.calls[0]![0] as URL;
        expect(url.href).toBe(
          "https://codize.dev/api/v1/sandbox/execute",
        );
      });

      it("sends POST method", async () => {
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse({ compile: null, run: sampleRunResult }),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        await client.sandbox.execute(sampleRequest);

        const init = fetchFn.mock.calls[0]![1] as RequestInit;
        expect(init.method).toBe("POST");
      });

      it("sends Authorization Bearer header with the API key", async () => {
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse({ compile: null, run: sampleRunResult }),
        );
        const client = new CodizeClient({
          apiKey: "test-api-key",
          fetchFn,
        });
        await client.sandbox.execute(sampleRequest);

        const init = fetchFn.mock.calls[0]![1] as RequestInit;
        const headers = init.headers as Record<string, string>;
        expect(headers["Authorization"]).toBe("Bearer test-api-key");
      });

      it("sends Content-Type: application/json header", async () => {
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse({ compile: null, run: sampleRunResult }),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        await client.sandbox.execute(sampleRequest);

        const init = fetchFn.mock.calls[0]![1] as RequestInit;
        const headers = init.headers as Record<string, string>;
        expect(headers["Content-Type"]).toBe("application/json");
      });

      it("serializes the request body as JSON", async () => {
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse({ compile: null, run: sampleRunResult }),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        await client.sandbox.execute(sampleRequest);

        const init = fetchFn.mock.calls[0]![1] as RequestInit;
        expect(JSON.parse(init.body as string)).toEqual(sampleRequest);
      });
    });

    // ----- Success response -----

    describe("success response", () => {
      it("returns compile and run from the response body", async () => {
        const body = {
          compile: {
            stdout: "",
            stderr: "",
            output: "",
            exitCode: 0,
          },
          run: { stdout: "ok\n", stderr: "", output: "ok\n", exitCode: 0 },
        };
        const fetchFn = vi.fn().mockResolvedValue(makeJsonResponse(body));
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const result = await client.sandbox.execute(sampleRequest);

        expect(result.data.compile).toEqual(body.compile);
        expect(result.data.run).toEqual(body.run);
      });

      it("returns compile as null when the API returns null", async () => {
        const body = {
          compile: null,
          run: { stdout: "", stderr: "", output: "", exitCode: 0 },
        };
        const fetchFn = vi.fn().mockResolvedValue(makeJsonResponse(body));
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const result = await client.sandbox.execute(sampleRequest);

        expect(result.data.compile).toBeNull();
      });

      it("returns the response headers", async () => {
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse(
            { compile: null, run: sampleRunResult },
            200,
            { "x-request-id": "xyz789" },
          ),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const result = await client.sandbox.execute(sampleRequest);

        expect(result.headers.get("x-request-id")).toBe("xyz789");
      });
    });

    // ----- Structured API error (CodizeApiError) -----

    describe("structured API error", () => {
      it("throws CodizeApiError for a structured error response", async () => {
        const errorBody = {
          error: { code: "UNAUTHORIZED", message: "Invalid API key" },
        };
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse(errorBody, 401),
        );
        const client = new CodizeClient({ apiKey: "bad-key", fetchFn });

        await expect(
          client.sandbox.execute(sampleRequest),
        ).rejects.toThrow(CodizeApiError);
      });

      it("sets the correct status on CodizeApiError", async () => {
        const errorBody = {
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        };
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse(errorBody, 429),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const error = await client.sandbox
          .execute(sampleRequest)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(CodizeApiError);
        expect((error as CodizeApiError).status).toBe(429);
      });

      it("sets the correct code on CodizeApiError", async () => {
        const errorBody = {
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        };
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse(errorBody, 429),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const error = await client.sandbox
          .execute(sampleRequest)
          .catch((e: unknown) => e);

        expect((error as CodizeApiError).code).toBe("RATE_LIMITED");
      });

      it("sets the correct message on CodizeApiError", async () => {
        const errorBody = {
          error: { code: "UNAUTHORIZED", message: "Invalid API key" },
        };
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse(errorBody, 401),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const error = await client.sandbox
          .execute(sampleRequest)
          .catch((e: unknown) => e);

        expect((error as CodizeApiError).message).toBe("Invalid API key");
      });

      it("includes validation errors array when present", async () => {
        const errorBody = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            errors: [
              { message: "'files' is required", path: ["files"] },
            ],
          },
        };
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse(errorBody, 422),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const error = await client.sandbox
          .execute(sampleRequest)
          .catch((e: unknown) => e);

        expect((error as CodizeApiError).errors).toEqual(
          errorBody.error.errors,
        );
      });

      it("attaches response headers to CodizeApiError", async () => {
        const errorBody = {
          error: { code: "UNAUTHORIZED", message: "Invalid API key" },
        };
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse(errorBody, 401, {
            "x-request-id": "err-123",
          }),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const error = await client.sandbox
          .execute(sampleRequest)
          .catch((e: unknown) => e);

        expect(
          (error as CodizeApiError).headers.get("x-request-id"),
        ).toBe("err-123");
      });
    });

    // ----- Unstructured error fallback (Error) -----

    describe("unstructured error fallback", () => {
      it("throws a plain Error when the body is not valid JSON", async () => {
        const fetchFn = vi.fn().mockResolvedValue(
          makeTextResponse("Gateway Timeout", 504),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const error = await client.sandbox
          .execute(sampleRequest)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(CodizeApiError);
      });

      it("includes status and body in the fallback error message for non-JSON", async () => {
        const fetchFn = vi.fn().mockResolvedValue(
          makeTextResponse("Bad Gateway", 502),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const error = await client.sandbox
          .execute(sampleRequest)
          .catch((e: unknown) => e);

        expect((error as Error).message).toContain("502");
        expect((error as Error).message).toContain("Bad Gateway");
      });

      it("throws a plain Error when JSON does not match the API error schema", async () => {
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse({ unexpected: true }, 500),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const error = await client.sandbox
          .execute(sampleRequest)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(CodizeApiError);
      });

      it("includes status in the fallback error message for schema mismatch", async () => {
        const fetchFn = vi.fn().mockResolvedValue(
          makeJsonResponse({ unexpected: true }, 500),
        );
        const client = new CodizeClient({ apiKey: "key", fetchFn });
        const error = await client.sandbox
          .execute(sampleRequest)
          .catch((e: unknown) => e);

        expect((error as Error).message).toContain("500");
      });
    });
  });
});
