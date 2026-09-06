# Changelog

## 6.18.0

### Minor Changes

- 4a1cd87: Bounded `preview` capture parity across official framework adapters through one shared helper (#311).

  `@agent-inspect/ai-sdk` and `@agent-inspect/openai-agents` previously accepted `capture: "preview"` and fell back to metadata-only with an `AI_ADAPTER_PREVIEW_NOT_AVAILABLE` warning. Both now persist bounded `*Preview` attributes, and `@agent-inspect/langchain` resolves its existing preview support through the same helper, so `capture`, `redactionProfile`, `maxPreviewChars`, and `onDiagnostic` mean the same thing in every adapter. A cross-adapter conformance matrix enforces the contract.

  Redaction runs on the structured value before a preview string is persisted, `maxPreviewChars` is a hard bound that the `share` and `strict` profiles cap further, and cycles, bigints, and throwing getters are handled without throwing into the traced application. Capture diagnostics are stable: `AI_CAPTURE_FIELD_UNAVAILABLE`, `AI_CAPTURE_PREVIEW_TRUNCATED`, and `AI_CAPTURE_PREVIEW_REDACTED`, reported through `onDiagnostic` and counted in `getDiagnostics().capture`.

  `metadata-only` remains the default and stays silent, there is no full-content capture mode, no network I/O is added, and the helper ships on the existing `agent-inspect/advanced` subpath rather than the root API. Preview redaction is key-based and bounded — it is not a sanitization guarantee for secrets embedded in free text.

- ba794e1: Add a no-key packed-consumer golden path for `@agent-inspect/ai-sdk` (`scripts/packed-ai-sdk-e2e.mjs`) and wire it into `pack:smoke` (#307, #213).
- 4fcee12: Render `view --errors-only` as a pruned human error tree (ancestors + failed nodes) while keeping `--errors-only --json` as the filtered event list (#330).
- 8c65ee5: Surface residual safety assessment after CLI `redact` (#328) and add a bounded local `--policy` JSON for redact/verify-safe (#329).
- 63b9606: Improve the broken-agent starter so good and regression paths return the same final answer while TraceContract trajectory checks PASS vs FAIL (`prove-same-output-wrong-path.mjs`).

## 6.17.8

### Patch Changes

- ddea9ea: Strictly validate `clean --keep` as a complete positive decimal integer token before planning deletions, so malformed values like `1.5`, `1e2`, or `10oops` fail closed instead of partial-parsing (#339, #340).
- b855436: Clarify `doctor` remediations with doc links for packed-consumer install mistakes, and land contributor regression coverage for packed-adapter golden paths, TraceFacts schema parity, and MCP protocol-state fixtures (#296, #305, #294, #302).
- 18941d0: Treat trace-derived MCP content as untrusted application data: advertise `instructions` on initialize, warn on trace-bearing tool descriptions, and add adversarial no-execution coverage (#344).

## 6.17.7

### Patch Changes

- f66c77a: Align high-confidence key/value credential redaction with verify-safe `key-value-secret` detection (for example `internal_token=<credential>`), keep path findings review-only, and document that redact remains best-effort (#327).
- 4d617f5: Clarify that `observe()` records only the top-level run boundary (no invented `step_*` events), and accept `check --forbid-tool` as a compatibility alias for `--forbidden-tool`.
- 0f4ada3: Fix `search --name` + `--status` so run-level filters are applied conjunctively and status-only hits no longer bypass a non-matching name (#323). Unblock CI after Vitest 3 coverage hangs: serialize local `npm install` in compat fixtures, exclude those suites from coverage workers, and run them as a separate non-coverage CI step.

## 6.17.6

### Patch Changes

- 075dc87: Security containment: enforce Studio ingest byte limits, reject symlinks, stream and atomically stage imports (bundle / file-drop / GitHub / HTTP), remediate Vitest/nanoid and website/example advisories, add the default-workflow no-egress harness (#225), lock the published API surface snapshot (#211), correct Evidence format docs (no signing; required sourceHashes), and extend free-text redaction residual coverage.

## 6.17.5

### Patch Changes

- 093811b: Harden deterministic TraceContract / check gates against fail-open empty configs (rule execution evidence, unique order IDs, requiredOrder implies presence, tool policy includes running invocations, ObservedOutcome requireAny), map #308–#311 release ownership, and make demo:verify / pack:smoke validation cross-platform without unnecessary shell invocation.

## 6.17.4

### Patch Changes

- c4b0f03: Fix camelCase / kebab / dot compound credential key redaction (`userPassword`, `clientSecret`) while keeping token-config keys and camelCase topic fields (`emailNote`) un-key-redacted.

## 6.17.3

### Patch Changes

- 737bb03: Docs updates (README mark/loop, case-study template, Evidence retention guidance, support reproduction), TraceFacts/Evidence/OTLP/CLI regression tests, and exclude the RUN boundary from `run.slowestNode`.

## 6.17.2

### Patch Changes

- a7a7ea8: Union CLI check shorthands with preset select, resolve nested v0.1 LLM metadata in checks, and present Debug / Prevent / Share with curated showcase media.

## 6.17.1

### Patch Changes

- 1904f50: Add public-safe LangGraph case study, use-case pages, demo Evidence samples (`pnpm demo:generate` / `demo:verify`), and fix `bundle verify --json` under the parent bundle command.

## 6.17.0

### Minor Changes

- 3294db3: Add check presets (`trajectory` / `safety` / `comprehensive`), local Evidence-on-failure flags for `check`/`gate`, and `bundle open` for verified local Evidence HTML.

## 6.16.2

### Patch Changes

- dab486a: Canonical docs website pipeline: load docs pages from repository Markdown via a content manifest and react-markdown renderer; remove the hand-maintained doc-content switch. Website-only dependency additions; no schema or runtime product change.

## 6.16.1

### Patch Changes

- 9aa0a80: Repository health and public-truth patch: permanent roadmap/active-plan structure, aggressive cleanup of archives/trains/proposals, ADRs, package-docs manifest, and repo:health CI gate. Docs/validators only — no schema or runtime product change.

## Unreleased

### Patch

- Repository health and public-truth cleanup toward 6.16.1 (in progress).

## 6.16.0

### Minor Changes

- 5a62e84: Evidence-first CI launch candidate: moderate + deep-swarm golden check→gate→Evidence paths, pack:smoke wiring, and local MCP/CI walkthrough docs. No schema break; no new packages; no default network.

## 6.15.0

### Minor Changes

- e70e3be: LangGraph fidelity classes A–E and persisted-trace developer APIs: relationship conformance, scaffolding diagnostics, openTraceFile/Directory/Text, TraceFacts/TraceContract conveniences, and stable AI\_\* remediation codes. No schema break; no new packages; no default network.

## 6.14.2

### Patch Changes

- 4850b62: Swarm relationship and safety precision: fix self-parent capture/ordering, normalize legacy self-edges, cycle-safe trees, and stop treating token-configuration fields as credentials.

## 6.14.1

### Patch Changes

- 44f80dd: Public positioning and AI discoverability patch: align README/docs/website/package metadata with shipped 6.14 TraceFacts, Evidence, MCP, and experimental matchers; add llms/AI manifests, Agent Skill, and public-truth validators. Docs and presentation only — no schema/runtime change.

## 6.14.0

### Minor Changes

- 52a3e23: Evidence-first CI and no-egress launch candidate: optional Evidence `semantics` TraceFacts summary on CI packages, MCP `get_trace_facts`, `init --framework langgraph`, langgraph-gate-evidence recipe, and no-egress/acceptance docs. No schema break; no new packages; no default network.

## 6.13.0

### Minor Changes

- 2b7bbdf: Cross-surface semantic parity and TraceFacts foundation: shared `summarizeSemanticParity` / `buildTraceFacts`, MCP diagnostics parity, scaffolding-root parent handling, TraceContract tool aliases, and experimental Vitest/Jest matchers (`toPassTraceContract`, `toHaveRequiredTool`). Delivers the v6.12.3 parity and v6.13.0 TraceFacts trains without a schema break or new packages.

## 6.12.2

### Patch Changes

- a3c0daa: Logical lifecycle projection for built-in checks and TraceContract: additive experimental `logicalEvents` (raw `events` unchanged), v0.1 start/complete pairing, stepId parent normalization, nested tool identity, and `metadata.tokens.*` safe metrics. Eval/gate/Evidence/MCP inherit via `runTraceChecks`. Includes anonymized pilot-shaped fixture and packed check→gate→bundle→verify E2E. No schema break; no new packages; no default network.

## 6.12.1

### Patch Changes

- 2a53751: Example-heavy presentation patch: align website/README/starters/docs with the 6.12 hero flow (causal failure, MCP coding-agent loop, Evidence v2), fix incomplete redact/verify-safe command examples, and extend docs:commands to starters. Docs and presentation only — no runtime product expansion.

## 6.12.0

### Minor Changes

- 3ee1692: Consolidation and stable launch candidate: positioning/portfolio tiers, install kits, honest packed/native/MCP matrices, PARTIAL design-partner trial worksheets, package maintenance audit (keep fixed group through v6), comparison/interop handoff, and launch demo checklist. No schema break; no new packages; no default upload; trial results not fabricated.

## 6.11.0

### Minor Changes

- 1b5d5d8: Local coding-agent debug loop: MCP server executable, protocol hardening, curated flagship read-only tools, first-causal-failure engine, safe evidence/contract tools, client configure CLI, Cursor/Claude/Codex/Gemini instructions, no-key debug-loop recipe, protocol/privacy conformance corpus, and packed MCP consumer smoke. No schema break; no new root/core dependencies; local stdio only; redaction defaults not weakened.

## 6.10.0

### Minor Changes

- 3d21e87: Portable Evidence v2: versioned evidence.json manifest (independent of trace schema), self-contained evidence.html with tree/timeline/causal/contract/diff/safety views, directory/html/zip bundle formats, bundle verify, CI artifacts/reporter evidence kind, XSS/a11y corpus, and packed E2E. No schema break; no new root/core dependencies; no default network upload; redaction defaults not weakened.

## 6.9.0

### Minor Changes

- 627f5f4: Safety precision and share policy: additive finding taxonomy, path-aware raw-content and detector precision, framework metadata sensitivity, source-vs-artifact verify-safe/bundle/MCP gating, --explain, and local override docs. No schema break; no new root/core dependencies; no default network upload; defaults not weakened.

## 6.8.0

### Minor Changes

- 69b6515: LangGraph fidelity contract for `@agent-inspect/langchain`: per-invocation lifecycle, callback reuse isolation, conservative parent reconciliation, synthetic semantic groups, tool identity fields, persist-by-intent, flush/finalize/close, and bounded diagnostics. Includes no-provider LangGraph coverage and NestJS/swarm recipes. No schema break; no new root/core dependencies; no default network upload.

## 6.7.5

### Patch Changes

- 5c4197f: Consumer and DX reliability: doctor resolves packages via entry (not package.json exports); Studio/index bump better-sqlite3 to 12.11.1 with lazy native load; LangChain omits absolute traceDir from attrs; Jest diagnoses missing trace associations; CLI output/profile aliases; NestJS/LangGraph env-gated recipe.

## 6.7.4

### Patch Changes

- ab2ad83: Real-integration blocker patch: standalone LangGraph-shaped callback runs complete via active lifecycle; CLI shorthand check flags auto-select their rules; human tool display names; shared step labels and newest-first search; cross-command run-status golden; synthetic LangGraph fixtures; publish prior RUN-lifecycle and stats label fixes.

## 6.7.3

### Patch Changes

- ac6747d: Corrective patch after 6.7.2: TraceContract allowed-status handling, OpenInference nano timestamp strings, cohort maxRelativeDelta for all numeric metrics, Windows path portability, CLI search --session exit codes, diff/normalizer correctness, Studio auth timing / ingest / bundle dedup, and related test hardening. No schema break; no new product surface.

## 6.7.2

### Patch Changes

- 9c1f54c: Product presentation patch: rebuild README/docs/package guides/website for the 6.7.x launch candidate, fix public CLI command targets, add docs/link/public-truth validation, and slim the public roadmap. Docs and presentation only — no runtime product expansion.

## 6.7.1

### Patch Changes

- dea3d91: Release tooling and public-truth patch: Changesets fixed group for all 18 public packages, linked-versions CI check, README/ROADMAP aligned to 6.7.x launch candidate, MCP server initialize version from package metadata.

## 6.7.0

### Minor Changes

- 5766d50: Semantic standards fixture validation and golden-path E2E script for launch candidate.

## 6.6.1

### Patch Changes

- 5766d50: Self-hosting ingestion security documentation and opt-in hardening guidance.

## 6.6.0

### Minor Changes

- 5766d50: Studio product pages (projects, runs, sessions, suites, safety, search), index refresh status, and Docker Compose example.

## 6.5.0

### Minor Changes

- e48a964: Add experimental TraceContract API in checks, fix all-skipped suite pass semantics, and cohort tolerance/sample diagnostics.

## 6.4.1

### Patch Changes

- 7e832d7: Trust and security patch: MCP result boundary, real bundle safety assessment, path sanitization, viewer XSS hardening, strict plugin manifests, gate validation, Studio init fixes, and packed quickstart E2E.

## 6.4.0

### Minor Changes

- f2039d6: Standards graduation: OpenInference/OTLP fixture validators, semconv pin, import recipes, and vendor graduation docs.

## 6.3.0

### Minor Changes

- 4850e38: MCP coding-agent workflow tools: summarize failures, decision notes, failed observations, and share-safe in-memory bundles.

## 6.2.0

### Minor Changes

- 2de83f6: Plugin convention: manifest schema, adapter SDK validators, and `plugins list|doctor|validate` CLI.

## 6.1.0

### Minor Changes

- v6.1.0 client-hosted ingestion for @agent-inspect/studio: file-drop, GitHub artifact import, optional HTTP ingest with token validation, and manual bundle upload. All ingest channels disabled by default; self-hosted only.

## 6.0.0

### Minor Changes

- Add self-hosted Studio (`@agent-inspect/studio`): optional read-only multi-project analyzer with `agent-inspect studio`, SQLite metadata cache, registry import, search/diff/reports views, optional basic auth, and self-hosting docs. Localhost by default; no maintainer cloud; no default upload.

## 5.4.0

### Minor Changes

- 31d5324: Add PM/QA suite templates and `suite init --template` for eight common agent scenarios.

## 5.3.0

### Minor Changes

- 165b1dc: Add suite and workspace viewer modes with `agent-inspect viewer --suite` and `--workspace` for local read-only evidence inspection.

## 5.2.0

### Minor Changes

- 52c2539: Add CI quality gates: `agent-inspect gate` with suite/threshold checks, stable exit codes, and JUnit/GitHub step-summary artifacts.

## 5.1.0

### Minor Changes

- 44e9684: Add cohort analysis v2: baseline/candidate comparison, grouping, metrics, and `agent-inspect cohort` CLI with JSON/Markdown/HTML reports.

## 5.0.0

### Minor Changes

- c5e3b16: Add trace suite config (`agent-inspect.suite.json`) with `suite init`, `validate`, `list`, `run`, and `report` commands for local CI trajectory checks.

## 4.4.0

### Minor Changes

- 42635d8: Add observed outcomes (`observeOutcome`) with OUTCOME events, report/check/search integration, and redaction-bounded evidence fields.

## 4.3.0

### Minor Changes

- 8a21bce: Add share-safe offline trace bundles (`agent-inspect bundle`) with automatic verify-safe, default share redaction profile, session/since targeting, and folder output for PR-ready evidence.

## 4.2.0

### Minor Changes

- Add sessions and activity as first-class local concepts (v4.2).

  - Derive session status, timing, last error, and retry counts on enriched `SessionSummary` (builds on v2.4 vocabulary; no timestamp-only causality).
  - Add `buildActivitySummary` for windowed activity feeds.
  - Expand CLI: `sessions latest`, `activity`, `show`, `handoffs`, `errors` (bare `sessions` list and `session <id>` unchanged).
  - Optional SQLite index acceleration for session loading with automatic scan fallback when the index is absent, stale, or corrupt.
  - Docs: CLI reference update.

## 4.1.0

### Minor Changes

- Add the optional local trace index (v4.1).

  - New optional package `@agent-inspect/index-sqlite`: a disposable, rebuildable SQLite index over AgentInspect JSONL traces for faster local queries. JSONL stays the source of truth, trace files are never mutated, deleting the index is always safe, and there is no network access. SQLite (`better-sqlite3`) lives only in this optional package — never in root/core.
  - New `agent-inspect index sqlite` CLI subcommands (`build`, `rebuild`, `status`, `query`, `clean`) that load the optional package on demand and print an install hint when it is absent.
  - Non-throwing read APIs (`queryRuns`, `indexStatus`, `isIndexStale`) with corruption/staleness recovery so callers can transparently fall back to a directory scan.
  - Docs: `docs/INDEX.md` plus `docs/CLI.md` reference.

## 4.0.0

### Major Changes

- dc4297b: Add the local trace workspace (v4.0): a project-local layout and manifest (`.agent-inspect/workspace.json`) with `workspace` CLI commands (`init`, `status`, `doctor`, `clean`, `path`) and a new experimental `agent-inspect/workspace` subpath export.

  The workspace is additive and backward-compatible: existing trace directories keep working, existing `.agent-inspect` directories are adopted without rewrite, and trace files are never deleted. All manifest-derived paths are traversal-guarded, `workspace clean` is a dry-run by default, and there is no network I/O, daemon, or database dependency.

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

## Historical (pre-3.5 train notes)

The v3.0→v3.5 feature train is complete. Older in-progress notes below are kept for history.

### README adoption polish (shipped in 3.5.x docs)

README adoption polish (brand header, product-loop visual, npm link hygiene). Docs-only; no runtime feature changes.

See [docs/implementation/reviews/README-ADOPTION-POLISH-REVIEW.md](docs/implementation/reviews/README-ADOPTION-POLISH-REVIEW.md).

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

### Draft notes (superseded by 2.3.0 / 2.4.0 releases)

#### Draft v2.4.0 Notes

- Added session/workflow causality model and `agent-inspect/advanced` session index helpers (`buildSessionIndex`, scope/cohort helpers, session fixtures).
- Added `agent-inspect sessions` and `agent-inspect session` CLI for multi-run handoff/retry navigation with timeline, critical-path, diagnostics, and JSON output.
- Added session-aware `search --session` and `check --session` / `--group` with aggregated per-run evidence.
- Added public optional `@agent-inspect/mcp` for local MCP **client** `tools/list` and `tools/call` telemetry with bounded summaries and `source.type: mcp-client` metadata.
- No schema version change, no MCP gateway/server, no timestamp-only causality inference, and no root/core dependency on MCP SDKs.

#### Draft v2.3.0 Notes

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
