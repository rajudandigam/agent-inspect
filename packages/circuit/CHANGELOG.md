# @agent-inspect/circuit

## 3.1.0

### Minor Changes

- 70f3fb2: v3.1 adoption train: public `@agent-inspect/harness`, `agent-inspect init` and `doctor` commands, adoption starters, and onboarding docs.

## 3.0.0

### Major Changes

- a1f743f: v3.0 extension contracts: `@agent-inspect/adapter-sdk` with registration, conformance, privacy helpers, transform/renderer contracts, optional rebuildable indexer, and community extension registry documentation. Linked major semver bump; persisted trace schema 1.0 unchanged.

## 2.6.0

### Minor Changes

- 57efe08: Release v2.6.0 with optional localhost viewer and read-only MCP server surfaces.

  This train adds `@agent-inspect/viewer`, `agent-inspect serve`, `@agent-inspect/mcp-server` read-only trace tools, and defers IDE extension until post-v2.6 demand review. All optional surfaces are read-only with share-profile defaults.

## 2.5.0

### Minor Changes

- 11edf90: Release v2.5.0 with deterministic guardrails and circuit utilities.

  This train adds `@agent-inspect/guardrails` and `@agent-inspect/circuit`, optional `check --guardrails` / `check --circuit` flags, eval safety rule factories, and recipes. No compliance claims, no remote policy engine, and no default enforcement.

## Unreleased

### Added

- Deterministic trace analyzers for tool/args repetition, loop iterations, retries, tool timeouts, runaway LLM loops, and branch width.
