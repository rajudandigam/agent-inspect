# Changelog

## Unreleased

Internal corrective and roadmap-planning work on `main`. No package version, changeset, tag, or publish is implied until maintainers explicitly confirm the next minor release.

### Added

- Added experimental `agent-inspect/writers` subpath with `TraceWriter`, `fileWriter`, `bufferedFileWriter`, `compositeWriter`, `memoryWriter`, and `nullWriter` as the first v1.6 runtime foundation slice.
- Added experimental `createInspectorRuntime()` as the low-level instance-scoped runtime foundation.
- Added experimental `createInspector()` public instance API for isolated local tracing with explicit writers.
- Added experimental `agent-inspect/readers` subpath with the `TraceReader` contract, deterministic format detection, `readTrace()`, and `openTrace()` for future local ingestion readers.
- Added the default AgentInspect JSONL reader behind `readTrace()` / `openTrace()` for v0.1, v0.2, and mixed local trace files.
- Added local OpenInference JSON and OTLP JSON readers behind `agent-inspect/readers`.
- Added `agent-inspect open` for local AgentInspect JSONL, OpenInference JSON, OTLP JSON, directory, and stdin ingestion through the canonical reader pipeline.
- Added deterministic runtime/universal-ingestion recipe coverage for memory writer, buffered writer, `createInspector()`, explicit formats, stdin, and safe shutdown.

### Changed

- Shared inspection commands now route AgentInspect JSONL loading through the canonical reader pipeline where compatible.

### Fixed

- Corrects the published CLI version path so `agent-inspect --version` reports the public package version.
- Makes `list`, `stats`, and `search` use the canonical dual-format read path for v0.1 and v0.2 trace files.
- Applies `report --redaction-profile share|strict` to the complete report, not only the execution tree section.
- Preserves mixed v0.1/v0.2 source ordering during normalization.
- Preserves error stack fidelity when converting persisted v0.2 events; `error.name` is no longer mapped to v0.1 `stack`.
- Preserves supported token usage fields across converters and inspection summaries: `input`, `output`, `total`, and `cached`.

### Notes

- Manual trace writing remains `schemaVersion: "0.1"`.
- v0.2 remains an experimental persisted-event foundation and dual-read input format, not the default writer.
- No provider pricing, token counting, cost engine, vendor upload, version bump, changeset, tag, or publish is included in the implementation commits.
- Routine corrective work is accumulated into the next minor release by default rather than published as a patch.

## 1.5.0

Released **2026-06-24**.

### Added

- Added non-breaking package subpath exports: `agent-inspect/advanced`, `/persisted`, `/logs`, `/exporters`, `/diff` (root `"."` export unchanged).
- Added `agent-inspect what <runId>` — concise local run summary (`--json`, `--no-correlation`).
- Added `agent-inspect report <runId>` — markdown/HTML inspection report (`what` + timeline + execution tree).
- Added core helpers: `buildRunWhatSummary`, `renderRunWhat`, `buildRunReport`.
- Added canonical dual-format read path: `parseTraceJsonl`, `persistedInspectEventToTraceEvents`; `readTraceEvents` accepts v0.1 and v0.2 JSONL.
- Added [TRACE-VOCABULARY-V1.5.md](docs/proposals/TRACE-VOCABULARY-V1.5.md) RFC and `fixtures/traces-v0.2/llm-tokens-and-streaming.jsonl`.
- Added [what-report-inspect recipe](examples/recipes/what-report-inspect/) and CI artifact updates for `what`/`report`.

### Changed

- Inspection CLI commands (`view`, `timeline`, `stats`, `search`, `diff`, `export`, `what`, `report`) use shared dual-format read path (v0.1 + v0.2).

### Notes

- Manual trace writing remains `schemaVersion: "0.1"`.
- v0.2 read is normalization for inspection — not a write-path switch.
- Token fields in reports are user-supplied metadata only; core does not count tokens.
- No vendor upload, hosted dashboard, or cost engine.
- Linked release aligns `@agent-inspect/tui` with `agent-inspect` and `@agent-inspect/langchain` (all **1.5.0**).

## 1.4.0

Released **2026-06-12**.

### Added

- Added `docs/CI-ARTIFACTS.md` and `examples/recipes/github-actions-artifact/` for CI trace artifact workflows.
- Added `agent-inspect timeline <runId>` — chronological local run view (`--json`, `--focus slow`).
- Added `agent-inspect stats` — local aggregate stats (`--since`, `--correlation-id`, `--group-id`, `--json`).
- Added `agent-inspect search` — deterministic local trace search (`--status`, `--kind`, `--name`, `--tool`, `--duration`, `--json`).
- Added core helpers: `buildRunTimeline`, `buildTraceStats`, `searchTraces`.

### Notes

- CI artifact upload is configured in user CI (e.g. GitHub Actions `upload-artifact`) — AgentInspect does not upload.
- Search is exact/contains matching only — no semantic search or index database.
- Stats/search scan local files linearly — intended for developer-machine scale.
- No Vitest/Jest reporter package in this release.
- Manual trace writing remains `schemaVersion: "0.1"`.
- Linked release aligns `@agent-inspect/tui` with `agent-inspect` and `@agent-inspect/langchain` (all **1.4.0**).

## 1.3.0

Released **2026-06-12**.

### Added

- Added correlation metadata on `inspectRun` / `maybeInspectRun` (`correlationId`, `requestId`, `decisionId`, `groupId`) and `getCurrentCorrelationMetadata()`.
- Added redaction profiles (`local`, `share`, `strict`) for trace safety and share-safe exports.
- Added `redactionProfile` on `InspectRunOptions` and `ExportOptions`.
- Added `--redaction-profile` to `agent-inspect export`.
- Added LangChain streaming metadata support (`stream: true`) for token chunk counts and duration.
- Added bounded preview behavior for preview capture mode (`maxStreamPreviewChars`).

### Notes

- LangChain `capture: "metadata-only"` remains default; full stream text is not captured by default.
- LangChain streaming does not emit per-token JSONL events.
- Redaction profiles are key-based safeguards, not compliance-grade PII detection.
- Export redaction does not upload anywhere and does not mutate original traces.
- No vendor upload, hosted dashboard, or OTLP HTTP sink was added.
- Manual trace writing remains `schemaVersion: "0.1"`; v0.2 is not written by default.

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
