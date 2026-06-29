# @agent-inspect/ai-sdk

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
