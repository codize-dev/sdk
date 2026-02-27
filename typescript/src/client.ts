import * as v from "valibot";
import { CodizeApiError, apiErrorResponseSchema } from "./error";

/**
 * Internal `fetch`-compatible function signature used by the client.
 */
type FetchFn = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

/**
 * Options for creating a {@link CodizeClient} instance.
 */
export type CodizeClientOptions = {
  /**
   * API key issued by Codize.
   */
  apiKey: string;
  /**
   * Custom `fetch` implementation.
   *
   * Useful for tests, custom environments, or transport-level instrumentation.
   */
  fetchFn?: FetchFn;
};

/**
 * Request payload for `sandbox.execute`.
 */
export type SandboxExecuteRequest = {
  /**
   * Language name used for execution.
   */
  language:
    | "go"
    | "javascript"
    | "python"
    | "ruby"
    | "rust"
    | "typescript"
    | (string & {});
  /**
   * Source files to execute, with their content.
   */
  files: {
    /**
     * File name
     */
    name: string;
    /**
     * Full text content of the file.
     */
    content: string;
  }[];
};

/**
 * Response returned by `sandbox.execute`.
 */
export type SandboxExecuteResponse = {
  /**
   * Raw HTTP response headers.
   */
  headers: Headers;
  data: {
    /**
     * Compile-stage output, if the selected language has a compile step.
     */
    compile: SandboxStageResult | null;
    /**
     * Run-stage output.
     */
    run: SandboxStageResult;
  };
};

/**
 * Output for a single sandbox stage (compile or run).
 */
export type SandboxStageResult = {
  /**
   * Standard output.
   */
  stdout: string;
  /**
   * Standard error.
   */
  stderr: string;
  /**
   * Combined output of stdout and stderr
   */
  output: string;
  /**
   * Process exit code.
   */
  exitCode: number | null;
};

/**
 * API client for Codize.
 */
export class CodizeClient {
  private readonly _apiKey: string;
  private readonly _fetchFn: FetchFn;
  private readonly _baseUrl: string = "https://codize.dev";

  /**
   * Namespace for sandbox APIs.
   */
  readonly sandbox: {
    /**
     * Executes code in the Codize sandbox.
     *
     * @param request Execution request containing language and files.
     * @returns Stage results and raw response headers.
     */
    execute: (
      request: SandboxExecuteRequest,
    ) => Promise<SandboxExecuteResponse>;
  };

  /**
   * Creates a new client.
   *
   * @param options Client configuration.
   */
  constructor(options: CodizeClientOptions) {
    this._apiKey = options.apiKey;
    this._fetchFn = options.fetchFn ?? fetch.bind(globalThis);
    this.sandbox = {
      execute: this._sandboxExecute.bind(this),
    };
  }

  /**
   * Sends an execution request to the sandbox endpoint.
   *
   * @param request Execution request payload.
   * @returns Parsed sandbox execution response.
   */
  private async _sandboxExecute(
    request: SandboxExecuteRequest,
  ): Promise<SandboxExecuteResponse> {
    const response = await this._fetchFn(
      new URL("/api/v1/sandbox/execute", this._baseUrl),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this._apiKey}`,
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      throw await this._apiError(response);
    }

    const data = (await response.json()) as SandboxExecuteResponse["data"];
    return {
      headers: response.headers,
      data: { compile: data.compile, run: data.run },
    };
  }

  /**
   * Converts a failed HTTP response into a rich error object.
   *
   * @param response Failed API response.
   * @returns Structured {@link CodizeApiError} when possible, otherwise `Error`.
   */
  private async _apiError(response: Response): Promise<Error> {
    const errorData = await response.text();
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(errorData);
    } catch {
      return new Error(
        `Unexpected API error: ${response.status} ${response.statusText} - ${errorData}`,
      );
    }

    const parsedError = v.safeParse(apiErrorResponseSchema, parsedJson);
    if (parsedError.success) {
      return new CodizeApiError(
        response.status,
        response.headers,
        parsedError.output,
      );
    } else {
      return new Error(
        `Unexpected API error: ${response.status} ${response.statusText} - ${errorData}`,
      );
    }
  }
}
