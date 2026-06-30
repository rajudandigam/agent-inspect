# @agent-inspect/tui

## 3.2.0

### Minor Changes

- 80f8f30: v3.2 framework adoption pack: AI SDK and OpenAI Agents local-only guides, NestJS harness path, Mastra RFC (deferred), adapter conformance evidence refresh.

### Patch Changes

- Updated dependencies [80f8f30]
  - agent-inspect@3.2.0

## 3.1.0

### Minor Changes

- 70f3fb2: v3.1 adoption train: public `@agent-inspect/harness`, `agent-inspect init` and `doctor` commands, adoption starters, and onboarding docs.

### Patch Changes

- Updated dependencies [70f3fb2]
  - agent-inspect@3.1.0

## 3.0.0

### Major Changes

- a1f743f: v3.0 extension contracts: `@agent-inspect/adapter-sdk` with registration, conformance, privacy helpers, transform/renderer contracts, optional rebuildable indexer, and community extension registry documentation. Linked major semver bump; persisted trace schema 1.0 unchanged.

### Patch Changes

- Updated dependencies [a1f743f]
  - agent-inspect@3.0.0

## 2.6.0

### Minor Changes

- 57efe08: Release v2.6.0 with optional localhost viewer and read-only MCP server surfaces.

  This train adds `@agent-inspect/viewer`, `agent-inspect serve`, `@agent-inspect/mcp-server` read-only trace tools, and defers IDE extension until post-v2.6 demand review. All optional surfaces are read-only with share-profile defaults.

### Patch Changes

- Updated dependencies [57efe08]
  - agent-inspect@2.6.0

## 2.5.0

### Minor Changes

- 11edf90: Release v2.5.0 with deterministic guardrails and circuit utilities.

  This train adds `@agent-inspect/guardrails` and `@agent-inspect/circuit`, optional `check --guardrails` / `check --circuit` flags, eval safety rule factories, and recipes. No compliance claims, no remote policy engine, and no default enforcement.

### Patch Changes

- Updated dependencies [11edf90]
  - agent-inspect@2.5.0

## 2.4.0

### Minor Changes

- 483168d: Release v2.4.0 with sessions workflow navigation and MCP client telemetry.

  This train adds multi-run session indexing on `agent-inspect/advanced`, `sessions` / `session` CLI, session-aware `search` and `check`, and the new `@agent-inspect/mcp` package for local MCP client `tools/list` and `tools/call` tracing. No schema break, no MCP gateway/server, and no default network behavior.

### Patch Changes

- Updated dependencies [483168d]
  - agent-inspect@2.4.0

## 2.3.0

### Minor Changes

- 22cad5a: Release v2.3.0 with hardened framework adapter paths.

  This train strengthens the official AI SDK, OpenAI Agents JS, and LangChain/LangGraph integrations with no-network fixtures, clearer local-only defaults, adapter conformance evidence, and adoption-ready recipes. Mastra and NestJS framework packages remain demand-gated; NestJS stays on the structured-log ingestion recipe path for this release.

### Patch Changes

- Updated dependencies [22cad5a]
  - agent-inspect@2.3.0

## 2.2.0

### Minor Changes

- efb3fef: Release v2.2.0 with local test reporter artifacts and CI summaries.

  Adds the public optional `@agent-inspect/vitest` and `@agent-inspect/jest` reporter packages, the shared experimental `agent-inspect/reporters` helpers, and the `agent-inspect ci-summary` workflow for deterministic local reporter manifests and CI artifacts.

### Patch Changes

- Updated dependencies [efb3fef]
  - agent-inspect@2.2.0

## 2.1.0

### Minor Changes

- 1e5e889: Release v2.1.0 with deterministic local eval and redaction utilities.

  Adds the public optional `@agent-inspect/redact` and `@agent-inspect/eval` packages, root CLI redaction and eval workflows, shared redaction profiles/findings, deterministic local eval checks, and adoption recipes for local eval, share-safe traces, and CI artifacts.

### Patch Changes

- Updated dependencies [1e5e889]
  - agent-inspect@2.1.0

## 2.0.0

### Major Changes

- 90fa75e: Release v2.0.0 with the stable root API contract, schema 1.0 persisted InspectEvent writer path, v0.1/v0.2/v1.0 reader compatibility, and explicit trace migration workflow.

### Patch Changes

- Updated dependencies [90fa75e]
  - agent-inspect@2.0.0

## 1.9.0

### Minor Changes

- 309350e: Release v1.9.0 adoption leverage with the private harness workspace, explain dry-run/local analysis, promoted adapter adoption paths, and the v2 root API slimming plan.

### Patch Changes

- Updated dependencies [309350e]
  - agent-inspect@1.9.0

## 1.8.0

### Minor Changes

- 0bee42c: Release v1.8.0 with OpenAI Agents trace processor support, optional Vitest/Jest reporter packages kept private, deterministic CI release checks, and the validated local-first reporting improvements from the v1.8 release train.

### Patch Changes

- Updated dependencies [0bee42c]
  - agent-inspect@1.8.0

## 1.7.0

### Minor Changes

- 94a7220: Release v1.7.0 framework-native adoption with the experimental AI SDK telemetry adapter, adapter conformance coverage, and local-first adapter documentation.

### Patch Changes

- Updated dependencies [94a7220]
  - agent-inspect@1.7.0

## 1.6.0

### Minor Changes

- Linked v1.6.0 release: local runtime/writer foundation, universal trace readers, `agent-inspect open`, shared reader integration, and deterministic runtime/ingestion recipes.

### Patch Changes

- Updated dependencies
  - agent-inspect@1.6.0

## 1.5.0

### Minor Changes

- Non-breaking subpath exports, `what` and `report` CLI commands, and canonical dual-format trace read path (v0.1 + v0.2 JSONL).

### Patch Changes

- Updated dependencies
  - agent-inspect@1.5.0

## 1.4.0

### Minor Changes

- v1.4.0: CI artifact recipe and docs; `agent-inspect timeline`, `stats`, and `search` CLI commands; core helpers `buildRunTimeline`, `buildTraceStats`, and `searchTraces`. Linked release aligns `@agent-inspect/tui` with `agent-inspect` and `@agent-inspect/langchain`. Read-only local inspection over v0.1 JSONL; no vendor upload, semantic search, or reporter packages.

### Patch Changes

- Updated dependencies
  - agent-inspect@1.4.0

## 1.2.1

### Patch Changes

- 503d240: Correlation metadata, redaction profiles for share-safe exports, and LangChain streaming metadata support.
- Updated dependencies [503d240]
  - agent-inspect@1.3.0

## 1.2.0

### Minor Changes

- 5a7f785: v1.2.0: experimental persisted-event foundation (`PersistedInspectEvent` schemaVersion 0.2), validators, TraceEvent/InspectEvent converters, in-memory tree bridge, v0.2 fixtures, and docs. Manual trace writing remains schemaVersion 0.1; no storage or CLI behavior change.

### Patch Changes

- Updated dependencies [5a7f785]
  - agent-inspect@1.2.0

## 1.1.0

### Minor Changes

- 21ecc6f: v1.1.0: env-gated tracing, trace safety (redaction + size bounds), LangChain JSONL persistence, logging recipes, CJS/ESM type export compatibility, community docs.

### Patch Changes

- Updated dependencies [21ecc6f]
  - agent-inspect@1.1.0

## 1.0.3

### Patch Changes

- Updated dependencies
  - agent-inspect@1.0.3

## 1.0.2

### Patch Changes

- c72f044: docs: polish README
- Updated dependencies [c72f044]
  - agent-inspect@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [575b093]
  - agent-inspect@1.0.1
