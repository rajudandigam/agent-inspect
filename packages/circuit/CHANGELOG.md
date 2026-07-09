# @agent-inspect/circuit

## 6.4.0

### Patch Changes

- Align linked package version with agent-inspect@6.4.0 release train.

## 6.1.0

### Minor Changes

- v6.1.0 client-hosted ingestion for @agent-inspect/studio: file-drop, GitHub artifact import, optional HTTP ingest with token validation, and manual bundle upload. All ingest channels disabled by default; self-hosted only.

## 6.0.0

### Minor Changes

- Align the linked package suite to 6.0.0 for the self-hosted Studio release train.

## 5.4.0

### Minor Changes

- Align the linked package suite to 5.4.0. No behavior changes in this package; keeps published versions consistent with the v5.4 PM/QA eval templates release.

## 5.3.0

### Minor Changes

- Align the linked package suite to 5.3.0. No behavior changes in this package; keeps published versions consistent with the v5.3 suite viewer release.

## 5.2.0

### Minor Changes

- Align the linked package suite to 5.2.0. No behavior changes in this package; keeps published versions consistent with the v5.2 CI quality gates release.

## 5.1.0

### Minor Changes

- Align the linked package suite to 5.1.0. No behavior changes in this package; keeps published versions consistent with the v5.1 cohort analysis release.

## 5.0.0

### Minor Changes

- Align the linked package suite to 5.0.0. No behavior changes in this package; keeps published versions consistent with the v5.0 trace suite config release.

## 4.4.0

### Minor Changes

- Align the linked package suite to 4.4.0. No behavior changes in this package; keeps published versions consistent with the v4.4 observed outcomes release.

## 4.3.0

### Minor Changes

- Align the linked package suite to 4.3.0. No behavior changes in this package; keeps published versions consistent with the v4.3 shareable trace bundles release.

## 4.2.0

### Minor Changes

- Align the linked package suite to 4.2.0. No behavior changes in these packages; keeps published versions consistent with the v4.2 sessions and activity release.

## 4.1.0

### Minor Changes

- Align the linked package suite to 4.1.0. No behavior changes in these packages; this keeps the published versions consistent with the v4.1 optional local index release.

## 4.0.0

### Patch Changes

- Linked release: version aligned to `agent-inspect` 4.0.0 (local trace workspace). No behavior changes in this package.

## 3.5.5

### Patch Changes

- 822da6c: Fix npm README images: use absolute raw GitHub SVG URLs with sanitize=true so the product-loop diagram and logos render on npmjs.com. Harden readme-product-loop.svg for sanitizer compatibility. Docs-only; no runtime API changes.

## 3.5.4

### Patch Changes

- 1ffe989: v3.5.4 README adoption polish: centered brand header, product-loop visual, npm package files for linked docs/assets. Docs-only; no runtime API changes.

## 3.5.3

### Patch Changes

- 05546b5: v3.5.3 docs hygiene: lean docs index, archive stale files, remove unavailable hero SVG from npm package files. Docs-only.

## 3.5.2

### Patch Changes

- 14d4ccc: v3.5.2 adoption demo kit: DEMO-SCRIPT, PITCH, Show HN draft, video script, SCREENSHOTS diagram index. Docs-only.

## 3.5.1

### Patch Changes

- af17d04: v3.5.1 adoption polish: root README and npm presentation, package READMEs, adoption docs, link/tarball hygiene. Docs-only; no runtime API changes.

## 3.5.0

### Minor Changes

- 71e94de: v3.5 adoption kit: ADOPTION guide, demo scripts, design partner kit, starter polish, comparison refresh, post-v3.5 handoff.

## 3.4.0

### Minor Changes

- 2fef104: v3.4 performance hardening: scale warnings, optional index CLI, stall/timeout check rules, performance and streaming docs.

## 3.3.0

### Minor Changes

- eaf8549: v3.3 VS Code surface: read-only extension scaffold, trace explorer, CLI-backed review commands, doctor output channel, adoption docs.

## 3.2.0

### Minor Changes

- 80f8f30: v3.2 framework adoption pack: AI SDK and OpenAI Agents local-only guides, NestJS harness path, Mastra RFC (deferred), adapter conformance evidence refresh.

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
