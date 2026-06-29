# @agent-inspect/adapter-sdk

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
