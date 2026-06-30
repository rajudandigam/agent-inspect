# @agent-inspect/guardrails

## 3.2.0

### Minor Changes

- 80f8f30: v3.2 framework adoption pack: AI SDK and OpenAI Agents local-only guides, NestJS harness path, Mastra RFC (deferred), adapter conformance evidence refresh.

### Patch Changes

- Updated dependencies [80f8f30]
  - @agent-inspect/redact@3.2.0

## 3.1.0

### Minor Changes

- 70f3fb2: v3.1 adoption train: public `@agent-inspect/harness`, `agent-inspect init` and `doctor` commands, adoption starters, and onboarding docs.

### Patch Changes

- Updated dependencies [70f3fb2]
  - @agent-inspect/redact@3.1.0

## 3.0.0

### Major Changes

- a1f743f: v3.0 extension contracts: `@agent-inspect/adapter-sdk` with registration, conformance, privacy helpers, transform/renderer contracts, optional rebuildable indexer, and community extension registry documentation. Linked major semver bump; persisted trace schema 1.0 unchanged.

### Patch Changes

- Updated dependencies [a1f743f]
  - @agent-inspect/redact@3.0.0

## 2.6.0

### Minor Changes

- 57efe08: Release v2.6.0 with optional localhost viewer and read-only MCP server surfaces.

  This train adds `@agent-inspect/viewer`, `agent-inspect serve`, `@agent-inspect/mcp-server` read-only trace tools, and defers IDE extension until post-v2.6 demand review. All optional surfaces are read-only with share-profile defaults.

### Patch Changes

- Updated dependencies [57efe08]
  - @agent-inspect/redact@2.6.0

## 2.5.0

### Minor Changes

- 11edf90: Release v2.5.0 with deterministic guardrails and circuit utilities.

  This train adds `@agent-inspect/guardrails` and `@agent-inspect/circuit`, optional `check --guardrails` / `check --circuit` flags, eval safety rule factories, and recipes. No compliance claims, no remote policy engine, and no default enforcement.

### Patch Changes

- Updated dependencies [11edf90]
  - @agent-inspect/redact@2.5.0

## Unreleased

### Added

- Deterministic local guardrail evaluators: banned phrase, PII leak (via redact), unsafe tool args, prompt-injection patterns, structured output, oversize output, and required JSON shape.
