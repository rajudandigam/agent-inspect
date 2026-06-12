# Changelog

## 1.3.0 — Unreleased

### Planned

- Correlation metadata foundation.
- Redaction profiles and share-safe export mode.
- LangChain streaming metadata support.

## 1.2.0

Released **2026-06-11**. Changeset `5a7f785`.

### Added

- Added experimental `PersistedInspectEvent` model (`schemaVersion: "0.2"`) as a source-agnostic event foundation.
- Added validator for persisted events (`isPersistedInspectEvent`).
- Added converters from legacy `schemaVersion: "0.1"` manual trace events to persisted events.
- Added converters between `InspectEvent` and `PersistedInspectEvent`.
- Added in-memory helpers to build run trees from persisted events (`persistedInspectEventsToRunTrees`, `traceEventsToPersistedRunTrees`).
- Added canonical v0.2 fixture samples under `fixtures/traces-v0.2/`.

### Notes

- Existing manual trace writing remains `schemaVersion: "0.1"`.
- v0.2 is not written by default in this release.
- CLI read/write behavior is unchanged.
- No vendor upload, hosted dashboard, OTLP HTTP sink, replay engine, or cost engine was added.

## 1.1.0

Changeset `21ecc6f`: env-gated tracing, trace safety (redaction + size bounds), LangChain JSONL persistence, logging recipes, CJS/ESM type export compatibility, community docs.

### Added

- Added env-gated tracing with `maybeInspectRun()` using `AGENT_INSPECT`.
- Added `enabled` option for `inspectRun` passthrough when tracing should be skipped.
- Added default-on persisted trace safety for manual traces, including metadata redaction and event size bounds.
- Added optional LangChain JSONL persistence with `persist: true` in `@agent-inspect/langchain`.
- Added production-shaped logging guidance with pino, log4js, and NestJS JSON logging recipes.
- Added community contribution scaffold, issue templates, and good-first-issue guidance.

### Fixed

- Fixed conditional type exports for ESM and CommonJS TypeScript consumers.
- Improved package compatibility for TypeScript Node16/NodeNext consumers using `import` and `require`.
- Updated public docs to avoid treating `docs-local` as primary contributor/user documentation.
- Updated stale docs around LangChain persistence, redaction, and package boundaries.

### Security

- Redacts sensitive manual trace metadata before disk by default.
- Allows explicit opt-out with `redact: false`.
- Bounds persisted event and metadata size to reduce accidental large trace files.
- Keeps JSON logs first-class and log4js parsing best-effort without unsafe JavaScript object parsing.

### Documentation

- Added/updated logging playbook for structured JSON logs ([docs/LOGGING-PLAYBOOK.md](docs/LOGGING-PLAYBOOK.md)).
- Updated public roadmap after the 1.1.0 release (Released recently / Now / Next / Future).
- Updated contributor/community docs for package boundaries and optional packages.
- Added clearer community onboarding and issue-draft guidance.

### Notes

- LangChain adapter APIs remain experimental.
- `persist: false` remains the default for `@agent-inspect/langchain`; `persist: true` is opt-in.
- Existing manual trace schema remains `schemaVersion: "0.1"`.
- Existing event names remain `run_started`, `run_completed`, `step_started`, and `step_completed`.
- There is still no `step_failed` event; failures are represented as `step_completed` with `status: "error"`.
- JSON logs remain first-class; log4js text parsing remains best-effort.
- No vendor upload, network sink, dashboard, replay engine, or cost engine was added.
- Root `agent-inspect` runtime dependencies remain `chalk`, `commander`, and `nanoid` only.

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
