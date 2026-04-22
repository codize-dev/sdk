# @codize/sdk

[![NPM Version](https://img.shields.io/npm/v/@codize/sdk)](https://www.npmjs.com/package/@codize/sdk)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/codize-dev/sdk/ci-typescript.yml)](https://github.com/codize-dev/sdk/actions/workflows/ci-typescript.yml)
[![GitHub License](https://img.shields.io/github/license/codize-dev/sdk)](../LICENSE)

Official TypeScript SDK for the Codize API.

## Installation

```console
$ npm install @codize/sdk
```

## Usage

```typescript
import { CodizeClient } from "@codize/sdk";

// Get your API key from Codize: https://codize.dev/settings/api-keys
const apiKey = "cdz_****";

const client = new CodizeClient({ apiKey });

const result = await client.sandbox.execute({
  runtime: "node-typescript",
  files: [
    {
      name: "index.ts",
      content: `console.log("Hello, World!");`,
    },
  ],
});

// `stdout`, `stderr`, and `output` are Base64-encoded.
console.log(result.data);
// => {
//      compile: {
//        stdout: "",
//        stderr: "",
//        output: "",
//        exitCode: 0,
//        status: "OK",
//        signal: null,
//        durationMs: 123,
//      },
//      run: {
//        stdout: "SGVsbG8sIFdvcmxkIQo=",
//        stderr: "",
//        output: "SGVsbG8sIFdvcmxkIQo=",
//        exitCode: 0,
//        status: "OK",
//        signal: null,
//        durationMs: 42,
//      },
//    }
```

## License

[MIT](../LICENSE)
