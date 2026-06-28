# CI reporters RFC

**Status:** active v2.2 planning.
**Scope:** Vitest/Jest reporter package boundary, shared artifact contract, safe CI summary workflow, package publication scope, and no-network defaults.
**Non-goals:** no runtime implementation in this RFC chunk; no package version change, changeset, tag, publish, dependency addition, hosted upload, GitHub API comment writer, dashboard, provider call, or network behavior.

## Problem

AgentInspect can already record local traces, run deterministic checks/evals, redact share-safe artifacts, and generate CI-friendly files. Test suites still need a first-class way to attach those local trace artifacts to failing tests without making every project write custom glue code.

v2.2 should make AgentInspect useful in daily test loops:

```text
test failure -> local trace artifacts -> safe summary -> CI artifact upload by the user's CI
```

The reporter layer must remain optional and framework-native. It must not make core depend on Vitest/Jest, and it must not upload artifacts or comment on pull requests by default.

## Goals

- Promote `@agent-inspect/vitest` and `@agent-inspect/jest` toward public optional reporter packages.
- Define a shared reporter artifact contract before framework-specific implementation.
- Produce deterministic JSON/Markdown/HTML artifacts for failing tests.
- Keep successful tests quiet by default.
- Preserve original test runner failures, exit codes, and stack behavior.
- Reuse `@agent-inspect/redact` for safe artifact profiles.
- Allow eval summaries to be attached when users explicitly run local evals.
- Keep all default behavior local, filesystem-only, dependency-light, and network-free.
- Let CI systems upload artifacts through their existing mechanisms.

## Non-Goals

- No hosted service, dashboard, artifact ingestion, telemetry upload, or remote storage.
- No GitHub API comments, checks API writes, OAuth flow, or GitHub App behavior in v2.2 defaults.
- No provider/model calls, LLM judge, provider pricing, or billing logic.
- No raw chain-of-thought capture and no default full prompt/output capture.
- No new root/core dependency on Vitest, Jest, GitHub SDKs, provider SDKs, or browser APIs.
- No automatic trace replay, cassette recording, or test rerun harness.
- No publication of reporter packages until the maintainer explicitly clears first-publication setup.

## Package Scope Decision

`@agent-inspect/vitest` and `@agent-inspect/jest` are currently private workspace packages at `1.7.0`. v2.2 may promote them to public optional packages, but the promotion must happen in implementation chunks with package smoke coverage and a manual first-publication gate before the v2.2 release.

| Package | Current State | v2.2 Target | Gate |
| --- | --- | --- | --- |
| `@agent-inspect/vitest` | `private: true`, optional reporter package | public optional package if chunk 2 validates reporter behavior | maintainer npm package/Trusted Publishing setup before release |
| `@agent-inspect/jest` | `private: true`, optional reporter package | public optional package if chunk 3 validates reporter behavior | maintainer npm package/Trusted Publishing setup before release |

Reporter packages remain out of root exports. Root/core must not depend on test frameworks.

## Ownership Boundary

| Layer | Owns | Must Not Own |
| --- | --- | --- |
| `agent-inspect` root/CLI | `ci-summary` command, local summary rendering, artifact index reading | framework reporter lifecycle, uploads, PR comments |
| `agent-inspect/reporters` or core reporter helpers | shared artifact manifest helpers and safe path utilities | Vitest/Jest peer dependencies |
| `@agent-inspect/vitest` | Vitest reporter/helper lifecycle, failed-test artifact wiring | Jest semantics, GitHub API calls, hosted uploads |
| `@agent-inspect/jest` | Jest reporter/helper lifecycle, CJS/Jest compatibility | Vitest assumptions, GitHub API calls, hosted uploads |
| `@agent-inspect/redact` | redaction profiles and findings for artifacts | reporter lifecycle or test runner integration |
| `@agent-inspect/eval` | deterministic eval summaries consumed by artifacts | reporter artifact layout ownership |

Chunk 2 keeps `@agent-inspect/vitest` private while making the reporter behavior adoption-ready. The package should only become public after the maintainer confirms first-publication setup before the v2.2 release.

Chunk 3 keeps `@agent-inspect/jest` private while making the reporter behavior adoption-ready. The package should only become public after the maintainer confirms first-publication setup before the v2.2 release.

## Shared Artifact Contract

The shared contract should be implemented before framework-specific reporters:

```ts
export interface TraceTestResult {
  testId: string;
  name: string;
  file?: string;
  status: "passed" | "failed" | "skipped" | "todo";
  durationMs?: number;
  tracePath?: string;
  artifacts: TraceArtifact[];
  diagnostics: TraceReporterDiagnostic[];
}

export interface TraceArtifactManifest {
  schemaVersion: "0.1";
  generatedAt: string;
  framework: "vitest" | "jest" | "manual";
  results: TraceTestResult[];
  artifacts: TraceArtifact[];
}

export interface TraceArtifact {
  kind: "trace" | "report" | "eval" | "redaction" | "summary";
  path: string;
  format: "json" | "jsonl" | "md" | "html";
  redactionProfile: "local" | "share" | "strict";
}
```

Chunk 1 implements the shared contract on the `agent-inspect/reporters` subpath, with matching internal `@agent-inspect/core/reporters` package exports for build and compatibility tests. Implementation names may continue to refine within that surface, but the durable requirements are:

- deterministic artifact paths and manifest order;
- safe relative paths under an explicit output directory;
- no path traversal or symlink escape;
- bounded artifact sizes;
- redaction before broad-share summaries;
- warning-rich diagnostics instead of reporter exceptions where possible.

## Reporter Behavior

Reporters should default to quiet success:

- successful tests do not print trace noise;
- failed tests produce a concise pointer to artifacts;
- original test failures and exit codes are preserved;
- reporter failures are surfaced as diagnostics/artifacts and must not mask the application/test failure;
- `flush()`/artifact writes are bounded and isolated.

Reporter options should be explicit:

```ts
{
  outputDir?: string;
  redactionProfile?: "local" | "share" | "strict";
  includeHtml?: boolean;
  includeEval?: boolean;
  maxArtifactBytes?: number;
}
```

## CI Summary Command

`agent-inspect ci-summary` should read local artifact manifests and write deterministic summaries for CI systems.

Chunk 4 implements `agent-inspect ci-summary` for local reporter manifests, with Markdown/JSON output and optional local GitHub step-summary file append.

It may support:

- Markdown output for `$GITHUB_STEP_SUMMARY`;
- JSON output for downstream tooling;
- safe relative artifact links;
- fail-summary filters.

It must not:

- upload artifacts;
- call GitHub APIs;
- require repository write access;
- infer secrets or expose unredacted payloads.

## Validation Expectations

v2.2 implementation chunks should add validation in proportion to scope:

- shared manifest unit tests;
- safe-path and traversal tests;
- redaction profile tests before summary rendering;
- Vitest reporter lifecycle tests;
- Jest CJS/ts-jest compatibility tests;
- package smoke for public reporter packages;
- recipe validation for GitHub Actions artifact workflows;
- compatibility smoke after package boundary changes.

## Release Requirements

Before v2.2 release prep:

- reporter package publication scope must be explicit;
- any public reporter package must be covered by pack smoke and compat smoke;
- first-publication setup for new public reporter packages must be confirmed by the maintainer;
- no root/core framework dependency may be introduced;
- no default network behavior may be introduced.
