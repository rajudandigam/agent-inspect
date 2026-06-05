# Changelog

## 1.1.0 — Unreleased

### Added

- Added env-gated tracing with `maybeInspectRun()` (`AGENT_INSPECT` environment variable).
- Added `enabled` option for `inspectRun` passthrough when tracing should be skipped.
- Added optional LangChain JSONL persistence (`persist: true` on `@agent-inspect/langchain`).
- Added production-shaped logging playbook and pino/log4js/NestJS recipes ([docs/LOGGING-PLAYBOOK.md](docs/LOGGING-PLAYBOOK.md)).
- Added community contribution scaffold and issue drafts.

### Fixed

- Fixed conditional type exports for ESM and CommonJS TypeScript consumers (`import.types` / `require.types`).

### Security

- Redacts sensitive manual trace metadata before disk by default; opt out with `redact: false`.
- Bounds persisted event and metadata size to reduce accidental large trace files.

### Notes

- LangChain adapter APIs remain experimental.
- JSON logs remain first-class; log4js parsing remains best-effort.
- No vendor upload or network sink behavior was added.
- No replay or cost engine was added.
- Public documentation prefers `docs/` over internal maintainer-only references.

## 1.0.3

### Patch Changes

- Add `enabled` option and `maybeInspectRun` helper for env-gated tracing (`AGENT_INSPECT`).
- Fix CJS/ESM conditional type exports for TypeScript consumers.
- Add community contributor scaffold and issue drafts.

## 1.0.2

### Patch Changes

- c72f044: docs: polish README

## 1.0.1

### Patch Changes

- 575b093: docs: onboarding polish

## 1.0.0

### Stable local tracing

- Stable manual tracing entry points: `inspectRun`, `step`, `step.llm`, `step.tool`, `observe`
- v0.1 JSONL trace compatibility retained (schemaVersion `"0.1"`)

### Local inspection CLI

- Stable CLI workflows: `list`, `view`, `clean`
- Safety-critical cleanup verifies traces before deletion

### Structured logs and live tail

- Local log-to-tree parsing and live tail workflows (`logs`, `tail`) with confidence labeling
- Best-effort log4js parsing; JSON logs first-class; no unsafe object parsing

### Optional LangChain adapter

- `@agent-inspect/langchain` optional adapter package (experimental surface)

### Optional TUI

- `@agent-inspect/tui` optional Ink/React viewer (experimental programmatic surface)

### Standards-aligned local export

- Markdown/HTML exports for sharing traces locally
- OpenInference-compatible JSON export (experimental; verify against backends)
- OTLP JSON export (experimental; JSON mapping only, no OTLP gRPC)

### Diff and compare

- Local, read-only diff of two manual traces (`diff`)

### Fixtures, recipes, and hardening (v0.9)

- Canonical fixtures under `fixtures/` plus validation scripts
- Runnable recipes under `examples/recipes/` with deterministic expected output markers
- Package smoke checks and adoption hardening tests

### Documentation and stability

- Added/updated API/CLI/schema/getting-started docs for v1.0 stabilization
- Added stability and compatibility tests to prevent accidental surface breaks

### Known limitations

- Local-first only; no SaaS/dashboard; no vendor sinks; no replay; no cost engine

## Historical notes (v0.1–v0.9)

AgentInspect started as a minimal manual tracing MVP (v0.1) and evolved through:

- local inspection improvements (metadata, filtering, safety checks)
- structured log ingestion (JSON first-class, log4js best-effort)
- conservative tree building rules with confidence labels
- incremental live tail rendering
- standards-aligned local exports (experimental)
- run diff and compare
- fixtures, recipes, and hardening focused on adoption

For detailed intent and sequencing (planning docs), see:

- `docs-local/roadmap/VERSION-ROADMAP.md`
- `docs-local/strategy/PRODUCT-PRINCIPLES.md`

# agent-inspect

## 0.1.2

### Patch Changes

- 62afb94: fix CI/publish smoke + vitest config

## 0.1.1

### Patch Changes

- bd719ef: Prepare npm publishing (Trusted Publishing via GitHub Actions OIDC) and polish documentation.
- 76791b8: Improve README, release docs, and npm publishing guidance.
