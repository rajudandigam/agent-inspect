# @agent-inspect/jest

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
