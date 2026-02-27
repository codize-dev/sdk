# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@codize/sdk` is the official TypeScript SDK for the Codize API — a service that runs code in sandboxed environments. The SDK provides a typed HTTP client (`CodizeClient`) with a single `sandbox.execute()` method. This repository is a monorepo; the TypeScript SDK lives in the `typescript/` subdirectory.

## Package Manager

**Bun** is used for all development tasks. Do NOT use npm/yarn for installing dependencies.

```sh
bun install                    # install dependencies
bun install --frozen-lockfile  # CI-style install (no lockfile changes)
```

Publishing uses `npm publish` (not `bun publish`), but everything else uses Bun.

## Build

```sh
bun run build   # runs tsdown → dist/index.mjs + dist/index.d.mts
```

Build tool is **tsdown** (configured in `tsdown.config.ts`). Entry: `src/index.ts`, format: ESM only, generates `.d.mts` declarations, cleans `dist/` before each build.

## Type Checking

```sh
npx tsc --noEmit
```

tsc is type-check only (`noEmit: true`). tsdown handles the actual compilation and emit.

## Testing / Linting

No test framework or linting tools are configured yet. `CodizeClient` accepts a `fetchFn` option for future test mocking.

## Architecture

Three source files:

- **`src/client.ts`** — `CodizeClient` class. Takes `{ apiKey, fetchFn? }`. Makes `POST https://codize.dev/api/v1/sandbox/execute` with Bearer auth. Returns `SandboxExecuteResponse` containing `data.compile` (nullable) and `data.run` stage results plus `headers`.
- **`src/error.ts`** — `CodizeApiError` class. Thrown on non-2xx responses. Parses error body using valibot's `apiErrorResponseSchema`. Exposes `.code`, `.status`, `.headers`, `.errors`.
- **`src/index.ts`** — Barrel file re-exporting all public types and classes from `client.ts` and `error.ts`.

## Key Dependencies

- **`valibot`** (runtime) — Schema validation for parsing API error responses
- **`tsdown`** (dev) — Build tool based on rolldown (Rust-based bundler)
- **`typescript`** (dev) — Type checking only

## TypeScript Conventions

- `strict: true` with `noUncheckedIndexedAccess` and `noImplicitOverride`
- `verbatimModuleSyntax: true` — must use `import type` for type-only imports
- `moduleResolution: "bundler"` with `allowImportingTsExtensions: true`

## Release Process

Fully automated via **Release Please** + GitHub Actions:

1. Commit to `main` using **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, etc.)
2. Release Please bot opens a release PR (bumps version, updates `CHANGELOG.md`)
3. Merging the release PR triggers `npm publish --access public` via CI
4. `prepublishOnly` hook runs `bun run build` automatically before publish

Do NOT manually publish. Always go through the Release Please flow.

## Monorepo Context

The repo root (`../`) contains Release Please config and CI workflows. Other language SDKs may be added as sibling directories to `typescript/`.
