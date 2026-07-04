# Changelog

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

## Unreleased

README adoption polish (brand header, product-loop visual, npm link hygiene). Docs-only; no runtime feature changes.

See [docs/implementation/reviews/README-ADOPTION-POLISH-REVIEW.md](docs/implementation/reviews/README-ADOPTION-POLISH-REVIEW.md).

---

## Historical (pre-3.5 train notes)

The v3.0→v3.5 feature train is complete. Older in-progress notes below are kept for history.

### v3.1 (shipped in 3.1.0)

- `agent-inspect init` and `agent-inspect doctor` CLI commands
- Public `@agent-inspect/harness`
- Adoption starters under `examples/starters/`

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

## 2.4.0

### Minor Changes

- 483168d: Release v2.4.0 with sessions workflow navigation and MCP client telemetry.

  This train adds multi-run session indexing on `agent-inspect/advanced`, `sessions` / `session` CLI, session-aware `search` and `check`, and the new `@agent-inspect/mcp` package for local MCP client `tools/list` and `tools/call` tracing. No schema break, no MCP gateway/server, and no default network behavior.

## 2.3.0

### Minor Changes

- 22cad5a: Release v2.3.0 with hardened framework adapter paths.

  This train strengthens the official AI SDK, OpenAI Agents JS, and LangChain/LangGraph integrations with no-network fixtures, clearer local-only defaults, adapter conformance evidence, and adoption-ready recipes. Mastra and NestJS framework packages remain demand-gated; NestJS stays on the structured-log ingestion recipe path for this release.

## 2.2.0

### Minor Changes

- efb3fef: Release v2.2.0 with local test reporter artifacts and CI summaries.

  Adds the public optional `@agent-inspect/vitest` and `@agent-inspect/jest` reporter packages, the shared experimental `agent-inspect/reporters` helpers, and the `agent-inspect ci-summary` workflow for deterministic local reporter manifests and CI artifacts.

## Unreleased

### Draft v2.4.0 Notes

- Added session/workflow causality model and `agent-inspect/advanced` session index helpers (`buildSessionIndex`, scope/cohort helpers, session fixtures).
- Added `agent-inspect sessions` and `agent-inspect session` CLI for multi-run handoff/retry navigation with timeline, critical-path, diagnostics, and JSON output.
- Added session-aware `search --session` and `check --session` / `--group` with aggregated per-run evidence.
- Added public optional `@agent-inspect/mcp` for local MCP **client** `tools/list` and `tools/call` telemetry with bounded summaries and `source.type: mcp-client` metadata.
- No schema version change, no MCP gateway/server, no timestamp-only causality inference, and no root/core dependency on MCP SDKs.

### Draft v2.3.0 Notes

- Hardened the official adapter paths for AI SDK, OpenAI Agents JS, and LangChain/LangGraph with no-network recipes, local-only defaults, clearer lifecycle coverage, and executable adapter conformance evidence.
- AI SDK coverage now includes route-style telemetry factory guidance, per-request integration isolation, tool/stream/error/parallel fixtures, token metadata, and the required `recordInputs: false` / `recordOutputs: false` host settings.
- OpenAI Agents JS documentation and fixtures distinguish local-only replacement via `setTraceProcessors()` from advanced additional processor usage.
- LangGraph support remains through `@agent-inspect/langchain`, with graph/node identity, subgraphs, checkpoint/session IDs, stream modes, handoffs, and parallel branch hints covered through callback metadata.
- Mastra and NestJS framework packages remain explicitly deferred. NestJS support stays on structured-log ingestion unless future demand proves a narrow local-only helper is worth maintaining.
- No root/core framework dependency, hosted upload, provider call, schema change, or public breaking change is added in this train.

## 2.1.0

### Minor Changes

- 1e5e889: Release v2.1.0 with deterministic local eval and redaction utilities.

  Adds the public optional `@agent-inspect/redact` and `@agent-inspect/eval` packages, root CLI redaction and eval workflows, shared redaction profiles/findings, deterministic local eval checks, and adoption recipes for local eval, share-safe traces, and CI artifacts.

## 2.0.0

### Major Changes

- 90fa75e: Release v2.0.0 with the stable root API contract, schema 1.0 persisted InspectEvent writer path, v0.1/v0.2/v1.0 reader compatibility, and explicit trace migration workflow.

## 1.9.0

### Minor Changes

- 309350e: Release v1.9.0 adoption leverage with the private harness workspace, explain dry-run/local analysis, promoted adapter adoption paths, and the v2 root API slimming plan.

## 1.8.0

Released **2026-06-27**.

### Minor Changes

- 0bee42c: Release v1.8.0 with OpenAI Agents trace processor support, optional Vitest/Jest reporter packages kept private, deterministic CI release checks, and the validated local-first reporting improvements from the v1.8 release train.

## 1.7.0

Released **2026-06-26**.

### Minor Changes

- 94a7220: Release v1.7.0 framework-native adoption with the experimental AI SDK telemetry adapter, declarative adapter conformance matrix, and local-first adapter documentation.

### Notes

- The v1.8 train carries the remaining adapter correctness work: AI SDK logical lifecycle identity, parallel integration isolation, explicit capture/redaction behavior, executable conformance fixtures, OpenAI Agents runtime mapping, and LangGraph no-network fixtures. v1.7.0 should not be read as claiming those deferred behaviors.

## 1.6.0

Released **2026-06-25**.

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
- No provider pricing, token counting, cost engine, vendor upload, hosted ingestion, replay, or default telemetry behavior is included.
- This release includes corrective work accumulated after v1.5.0 plus the v1.6.0 runtime/reader foundation.

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
