# @agent-inspect/eval

## 3.5.2

### Patch Changes

- 14d4ccc: v3.5.2 adoption demo kit: DEMO-SCRIPT, PITCH, Show HN draft, video script, SCREENSHOTS diagram index. Docs-only.
- Updated dependencies [14d4ccc]
  - agent-inspect@3.5.2
  - @agent-inspect/guardrails@3.5.2
  - @agent-inspect/circuit@3.5.2

## 3.5.1

### Patch Changes

- af17d04: v3.5.1 adoption polish: root README and npm presentation, package READMEs, adoption docs, link/tarball hygiene. Docs-only; no runtime API changes.
- Updated dependencies [af17d04]
  - agent-inspect@3.5.1
  - @agent-inspect/guardrails@3.5.1
  - @agent-inspect/circuit@3.5.1

## 3.5.0

### Minor Changes

- 71e94de: v3.5 adoption kit: ADOPTION guide, demo scripts, design partner kit, starter polish, comparison refresh, post-v3.5 handoff.

### Patch Changes

- Updated dependencies [71e94de]
  - agent-inspect@3.5.0
  - @agent-inspect/guardrails@3.5.0
  - @agent-inspect/circuit@3.5.0

## 3.4.0

### Minor Changes

- 2fef104: v3.4 performance hardening: scale warnings, optional index CLI, stall/timeout check rules, performance and streaming docs.

### Patch Changes

- Updated dependencies [2fef104]
  - agent-inspect@3.4.0
  - @agent-inspect/guardrails@3.4.0
  - @agent-inspect/circuit@3.4.0

## 3.3.0

### Minor Changes

- eaf8549: v3.3 VS Code surface: read-only extension scaffold, trace explorer, CLI-backed review commands, doctor output channel, adoption docs.

### Patch Changes

- Updated dependencies [eaf8549]
  - agent-inspect@3.3.0
  - @agent-inspect/guardrails@3.3.0
  - @agent-inspect/circuit@3.3.0

## 3.2.0

### Minor Changes

- 80f8f30: v3.2 framework adoption pack: AI SDK and OpenAI Agents local-only guides, NestJS harness path, Mastra RFC (deferred), adapter conformance evidence refresh.

### Patch Changes

- Updated dependencies [80f8f30]
  - agent-inspect@3.2.0
  - @agent-inspect/guardrails@3.2.0
  - @agent-inspect/circuit@3.2.0

## 3.1.0

### Minor Changes

- 70f3fb2: v3.1 adoption train: public `@agent-inspect/harness`, `agent-inspect init` and `doctor` commands, adoption starters, and onboarding docs.

### Patch Changes

- Updated dependencies [70f3fb2]
  - agent-inspect@3.1.0
  - @agent-inspect/guardrails@3.1.0
  - @agent-inspect/circuit@3.1.0

## 3.0.0

### Major Changes

- a1f743f: v3.0 extension contracts: `@agent-inspect/adapter-sdk` with registration, conformance, privacy helpers, transform/renderer contracts, optional rebuildable indexer, and community extension registry documentation. Linked major semver bump; persisted trace schema 1.0 unchanged.

### Patch Changes

- Updated dependencies [a1f743f]
  - agent-inspect@3.0.0
  - @agent-inspect/guardrails@3.0.0
  - @agent-inspect/circuit@3.0.0

## 2.6.0

### Minor Changes

- 57efe08: Release v2.6.0 with optional localhost viewer and read-only MCP server surfaces.

  This train adds `@agent-inspect/viewer`, `agent-inspect serve`, `@agent-inspect/mcp-server` read-only trace tools, and defers IDE extension until post-v2.6 demand review. All optional surfaces are read-only with share-profile defaults.

### Patch Changes

- Updated dependencies [57efe08]
  - agent-inspect@2.6.0
  - @agent-inspect/guardrails@2.6.0
  - @agent-inspect/circuit@2.6.0

## 2.5.0

### Minor Changes

- 11edf90: Release v2.5.0 with deterministic guardrails and circuit utilities.

  This train adds `@agent-inspect/guardrails` and `@agent-inspect/circuit`, optional `check --guardrails` / `check --circuit` flags, eval safety rule factories, and recipes. No compliance claims, no remote policy engine, and no default enforcement.

### Patch Changes

- Updated dependencies [11edf90]
  - agent-inspect@2.5.0
  - @agent-inspect/guardrails@2.5.0
  - @agent-inspect/circuit@2.5.0

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
