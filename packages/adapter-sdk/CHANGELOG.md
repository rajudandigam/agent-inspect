# @agent-inspect/adapter-sdk

## 3.4.0

### Minor Changes

- 2fef104: v3.4 performance hardening: scale warnings, optional index CLI, stall/timeout check rules, performance and streaming docs.

### Patch Changes

- Updated dependencies [2fef104]
  - agent-inspect@3.4.0

## 3.3.0

### Minor Changes

- eaf8549: v3.3 VS Code surface: read-only extension scaffold, trace explorer, CLI-backed review commands, doctor output channel, adoption docs.

### Patch Changes

- Updated dependencies [eaf8549]
  - agent-inspect@3.3.0

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

## Unreleased

### Added

- Adapter registration helpers, mapping utilities, fixture skeleton generator, privacy checklist, and conformance runner for third-party adapter authors.
- `TraceTransform` / `TraceRenderer` contracts with pipeline composition and `renderWithSafety` bounds.
- Optional `TraceIndexer` contract with rebuildable directory indexer and invalidation helpers.
