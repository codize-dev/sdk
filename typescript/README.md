# @codize/sdk

[![NPM Version](https://img.shields.io/npm/v/@codize/sdk)](https://www.npmjs.com/package/@codize/sdk)
[![GitHub License](https://img.shields.io/github/license/codize-dev/sdk)](./LICENSE)

Official TypeScript SDK for the Codize API.

## Installation

```console
$ npm install @codize/sdk
```

## Usage

```typescript
import { CodizeClient } from "@codize/sdk";

// Get your API key from the Codize: https://codize.dev/settings/api-keys
const apiKey = "cdz_****";

const client = new CodizeClient({ apiKey });

const result = await client.sandbox.execute({
  language: "typescript",
  files: [
    {
      name: "index.ts",
      content: `console.log("Hello, World!");`,
    },
  ],
});

console.log(result.data);
// => {
//      compile: {
//        stdout: "",
//        stderr: "",
//        output: "",
//        exit_code: 0,
//      },
//      run: {
//        stdout: "Hello, World!\n",
//        stderr: "",
//        output: "Hello, World!\n",
//        exit_code: 0,
//      },
//    }
```

## License

[MIT](../LICENSE)
