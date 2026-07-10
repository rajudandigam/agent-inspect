# @agent-inspect/adapter-sdk

## 6.6.0

### Patch Changes

- Updated dependencies [5766d50]
  - agent-inspect@6.6.0

## 6.5.0

### Patch Changes

- Updated dependencies [e48a964]
  - agent-inspect@6.5.0

## 6.4.1

### Patch Changes

- 7e832d7: Trust and security patch: MCP result boundary, real bundle safety assessment, path sanitization, viewer XSS hardening, strict plugin manifests, gate validation, Studio init fixes, and packed quickstart E2E.
- Updated dependencies [7e832d7]
  - agent-inspect@6.4.1

## 6.4.0

### Patch Changes

- Updated dependencies [f2039d6]
  - agent-inspect@6.4.0

## 6.3.0

### Patch Changes

- Updated dependencies [4850e38]
  - agent-inspect@6.3.0

## 6.2.0

### Minor Changes

- 2de83f6: Plugin convention: manifest schema, adapter SDK validators, and `plugins list|doctor|validate` CLI.

### Patch Changes

- Updated dependencies [2de83f6]
  - agent-inspect@6.2.0

## 6.1.0

### Minor Changes

- v6.1.0 client-hosted ingestion for @agent-inspect/studio: file-drop, GitHub artifact import, optional HTTP ingest with token validation, and manual bundle upload. All ingest channels disabled by default; self-hosted only.

### Patch Changes

- Updated dependencies
  - agent-inspect@6.1.0

## 6.0.0

### Patch Changes

- Updated dependencies
  - agent-inspect@6.0.0

## 5.4.0

### Patch Changes

- Updated dependencies [31d5324]
  - agent-inspect@5.4.0

## 5.3.0

### Patch Changes

- Updated dependencies [165b1dc]
  - agent-inspect@5.3.0

## 5.2.0

### Patch Changes

- Updated dependencies [52c2539]
  - agent-inspect@5.2.0

## 5.1.0

### Patch Changes

- Updated dependencies [44e9684]
  - agent-inspect@5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies [c5e3b16]
  - agent-inspect@4.5.0

## 4.4.0

### Patch Changes

- Updated dependencies [42635d8]
  - agent-inspect@4.4.0

## 4.3.0

### Patch Changes

- Updated dependencies [8a21bce]
  - agent-inspect@4.3.0

## 4.2.0

### Minor Changes

- Align the linked package suite to 4.2.0. No behavior changes in these packages; keeps published versions consistent with the v4.2 sessions and activity release.

### Patch Changes

- Updated dependencies
  - agent-inspect@4.2.0

## 4.1.0

### Minor Changes

- Align the linked package suite to 4.1.0. No behavior changes in these packages; this keeps the published versions consistent with the v4.1 optional local index release.

### Patch Changes

- Updated dependencies
  - agent-inspect@4.1.0

## 4.0.0

### Patch Changes

- Linked release: version aligned to `agent-inspect` 4.0.0 (local trace workspace). No behavior changes in this package.
- Updated dependencies [dc4297b]
  - agent-inspect@4.0.0

## 3.5.5

### Patch Changes

- 822da6c: Fix npm README images: use absolute raw GitHub SVG URLs with sanitize=true so the product-loop diagram and logos render on npmjs.com. Harden readme-product-loop.svg for sanitizer compatibility. Docs-only; no runtime API changes.
- Updated dependencies [822da6c]
  - agent-inspect@3.5.5

## 3.5.4

### Patch Changes

- 1ffe989: v3.5.4 README adoption polish: centered brand header, product-loop visual, npm package files for linked docs/assets. Docs-only; no runtime API changes.
- Updated dependencies [1ffe989]
  - agent-inspect@3.5.4

## 3.5.3

### Patch Changes

- 05546b5: v3.5.3 docs hygiene: lean docs index, archive stale files, remove unavailable hero SVG from npm package files. Docs-only.
- Updated dependencies [05546b5]
  - agent-inspect@3.5.3

## 3.5.2

### Patch Changes

- 14d4ccc: v3.5.2 adoption demo kit: DEMO-SCRIPT, PITCH, Show HN draft, video script, SCREENSHOTS diagram index. Docs-only.
- Updated dependencies [14d4ccc]
  - agent-inspect@3.5.2

## 3.5.1

### Patch Changes

- af17d04: v3.5.1 adoption polish: root README and npm presentation, package READMEs, adoption docs, link/tarball hygiene. Docs-only; no runtime API changes.
- Updated dependencies [af17d04]
  - agent-inspect@3.5.1

## 3.5.0

### Minor Changes

- 71e94de: v3.5 adoption kit: ADOPTION guide, demo scripts, design partner kit, starter polish, comparison refresh, post-v3.5 handoff.

### Patch Changes

- Updated dependencies [71e94de]
  - agent-inspect@3.5.0

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
