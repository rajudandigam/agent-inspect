# Roadmap

AgentInspect is the **local-first trace workbench** for TypeScript AI agents — understand, debug, compare, annotate, and export agent runs locally before you need a hosted observability platform.

**Product loop:** framework event → local JSONL → inspect / report / diff → CI artifact → optional standards export.

This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) and [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) for current boundaries.

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · framework-aware but not framework-locked · no vendor upload by default · no SaaS/dashboard scope.

**Current release on npm:** [1.7.0](CHANGELOG.md#170) (`agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, `@agent-inspect/tui` — all aligned).

---

## Released recently

Shipped in **1.7.0** (see [CHANGELOG.md](CHANGELOG.md#170)):

- **AI SDK adapter:** experimental `@agent-inspect/ai-sdk` package for Vercel AI SDK v6 telemetry integrations.
- **Metadata-only local capture:** AI SDK examples use `recordInputs: false`, `recordOutputs: false`, and no default upload behavior.
- **Adapter hardening:** tool/error/streaming coverage, local no-network recipe coverage, and adapter conformance fixtures.
- **Framework decisions:** OpenAI Agents JS tracing processor RFC/scaffold remains private, and LangGraph support stays through `@agent-inspect/langchain` until future evidence warrants more.
- **Linked release:** `agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, and `@agent-inspect/tui` at **1.7.0**.
- **Unchanged by design:** local-first, no vendor upload, manual traces remain `schemaVersion: "0.1"`.

Shipped in **1.6.0** (see [CHANGELOG.md](CHANGELOG.md#160)):

- **Runtime foundation:** experimental `agent-inspect/writers`, `createInspector()`, and low-level runtime APIs for local instance-scoped tracing.
- **Universal local ingestion:** experimental `agent-inspect/readers`, local AgentInspect/OpenInference/OTLP readers, and `agent-inspect open`.
- **Shared reader pipeline:** compatible inspection commands now use the canonical local read path.
- **Adoption:** deterministic runtime/universal-ingestion recipe coverage.
- **Linked release:** all three npm packages at **1.6.0**.
- **Unchanged by design:** local-first, no vendor upload, manual traces remain `schemaVersion: "0.1"`.

Shipped in **1.5.0** (see [CHANGELOG.md](CHANGELOG.md#150)):

- **API subpaths:** non-breaking `agent-inspect/advanced`, `/persisted`, `/logs`, `/exporters`, `/diff` (root export unchanged).
- **Inspection CLI:** `what`, `report` — concise summaries and markdown/HTML reports from local JSONL.
- **Dual-format read:** inspection commands read v0.1 and v0.2 JSONL via normalization.
- **Adoption:** [what-report-inspect recipe](examples/recipes/what-report-inspect/) and CI artifact updates.
- **Linked release:** all three npm packages at **1.5.0**.
- **Unchanged by design:** local-first, no vendor upload, manual traces remain `schemaVersion: "0.1"`.

Shipped in **1.4.0** (see [CHANGELOG.md](CHANGELOG.md#140)):

- **CI artifacts:** [docs/CI-ARTIFACTS.md](docs/CI-ARTIFACTS.md) and [github-actions-artifact recipe](examples/recipes/github-actions-artifact/).
- **Local observability CLI:** `timeline`, `stats`, `search` — read-only over local JSONL.
- **Core helpers:** `buildRunTimeline`, `buildTraceStats`, `searchTraces`.
- **Linked release:** all three npm packages at **1.4.0** (resolves prior `@agent-inspect/tui` version drift).
- **Unchanged by design:** local-first, no vendor upload, manual traces remain `schemaVersion: "0.1"`.

Shipped in **1.3.0** (see [CHANGELOG.md](CHANGELOG.md#130)):

- **Correlation metadata:** `correlationId`, `requestId`, `decisionId`, `groupId` on `run_started`; `getCurrentCorrelationMetadata()`.
- **Redaction profiles:** `local` / `share` / `strict` on trace writing and `agent-inspect export --redaction-profile`.
- **LangChain streaming metadata:** opt-in `stream: true` — chunk counts, timing, bounded preview; no full token capture by default.
- **Unchanged by design:** local-first, no vendor upload, manual traces remain `schemaVersion: "0.1"`.

Shipped in **1.2.0** (see [CHANGELOG.md](CHANGELOG.md#120)):

- **Persisted-event foundation:** `PersistedInspectEvent` model (`schemaVersion: "0.2"`), `isPersistedInspectEvent` validator.
- **Converters:** v0.1 `TraceEvent` → persisted; `InspectEvent` ↔ `PersistedInspectEvent`.
- **In-memory tree bridge:** `persistedInspectEventsToRunTrees`, `traceEventsToPersistedRunTrees` (via existing `TreeBuilder`).
- **Docs and fixtures:** v0.2 schema/API docs; canonical `fixtures/traces-v0.2/` samples.
- **Unchanged by design:** manual trace writing remains `schemaVersion: "0.1"`; v0.2 is **not written by default**; CLI read/write behavior unchanged.

Shipped in **1.1.0** (see [CHANGELOG.md](CHANGELOG.md#110)):

- **Production package compatibility:** ESM/CJS conditional type exports (`import.types` / `require.types`).
- **Runtime adoption ergonomics:** `enabled` option on `inspectRun` and `maybeInspectRun()` with `AGENT_INSPECT` env gating.
- **Safety hardening:** manual metadata redaction before disk (default on; `redact: false` opt-out) and persisted event size bounds.
- **LangChain persistence:** optional JSONL traces via `@agent-inspect/langchain` when `persist: true` (experimental adapter).
- **Logging adoption:** [docs/LOGGING-PLAYBOOK.md](docs/LOGGING-PLAYBOOK.md) plus pino, log4js, and NestJS JSON logging recipes and fixtures.
- **Community readiness:** contributing docs, issue templates, good-first-issue guidance, and OSS activation batches.

LangChain and TUI programmatic APIs remain **experimental**. JSON logs remain first-class; log4js parsing remains best-effort.

---

## Now

**v1.8.0 planning after framework-native adoption** — v1.7.0 is published, and the AI SDK adapter is available as an optional package. The next train should start with a planning reset before implementation.

The next minor release is **v1.8.0 CI reporters + deterministic checks**: optional test-runner reporters and local assertion/cohort helpers, without adding hosted services or default upload behavior. The v1.7 adapter work remains local-only and metadata-first, with `recordInputs: false` / `recordOutputs: false` examples and a no-network [ai-sdk-local-telemetry recipe](examples/recipes/ai-sdk-local-telemetry/). See [ROADMAP-V1.7-TO-V3.md](docs/implementation/ROADMAP-V1.7-TO-V3.md).

**OSS Activation Batch 01** ([#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen)) · **Batch 02** ([#18–#30](https://github.com/rajudandigam/agent-inspect/issues/18)) — contributor docs, recipes, fixtures, and design RFCs. **Batch 03 waits** until Batch 02 receives comments or PRs.

Curated entry points: [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md) · source bodies: `.github/LIVE_ISSUE_BATCH_01/` · `.github/LIVE_ISSUE_BATCH_02/`

| Area | Intent |
| ---- | ------ |
| **v1.8.0 planning** | CI reporters and deterministic check helpers after the v1.7 adapter release — keep optional integrations package-scoped and local-first. |
| **Support contributor issues** | Triage and review PRs for [#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen) and [#18–#30](https://github.com/rajudandigam/agent-inspect/issues/18). |
| **Collect feedback** | [Discussions](https://github.com/rajudandigam/agent-inspect/discussions) and issues — map to published sequence without delivery promises. |

Execution program: [ROADMAP-EXECUTION-V1.5-TO-V2.md](docs/implementation/ROADMAP-EXECUTION-V1.5-TO-V2.md) · state: [RELEASE-TRAIN-STATE.md](docs/implementation/RELEASE-TRAIN-STATE.md) · [CURSOR-MAINTAINER-ROADMAP.md](docs/implementation/CURSOR-MAINTAINER-ROADMAP.md)

Activation helpers: [docs/community/OUTREACH-TEMPLATES.md](docs/community/OUTREACH-TEMPLATES.md) · [docs/community/CONTRIBUTOR-ROLES.md](docs/community/CONTRIBUTOR-ROLES.md) · [docs/community/DISCUSSIONS-STARTERS.md](docs/community/DISCUSSIONS-STARTERS.md)

---

## Next

Published sequence after **v1.7.0** — directional, not delivery guarantees.

| Release | Area | Intent |
| ------- | ---- | ------ |
| **v1.8.0** | CI reporters + deterministic checks | `@agent-inspect/vitest`, `@agent-inspect/jest`; local `cohort`, `check`, `assert` helpers ([#24](https://github.com/rajudandigam/agent-inspect/issues/24), [#28](https://github.com/rajudandigam/agent-inspect/issues/28)). |
| **v1.9.0** | Standards hardening + v2 freeze | OpenInference / OTLP conformance fixtures and schema 1.0 freeze ([#25](https://github.com/rajudandigam/agent-inspect/issues/25)). |

---

## Future

Exploratory — requires design review and explicit scope approval before implementation.

| Area | Intent | Direction (non-committal) |
| ---- | ------ | ------------------------- |
| **Explain experiment** | Opt-in natural-language trace summaries — no version until maintainer approves scope. | conditional |
| **Experimental OTLP HTTP sink** | Opt-in, local-or-explicit-endpoint only — not a default upload pipeline. | post-v2 exploratory |
| **Optional cassette / replay research** | Exploratory only if community demand appears — not a default replay engine. | TBD |
| **v2.0.0 stable contract** | Stable API reset, unified write format; `schemaVersion: "0.1"` traces remain readable; migration guide required. | v2.0 |

---

## Explicit non-goals (all phases)

- SaaS backend or multi-tenant hosted product
- Production APM replacement (sampling agents, fleet aggregation, SLAs)
- Web dashboard as a core deliverable
- Automatic universal framework instrumentation without explicit integration
- Replay / fork execution from traces (default product scope)
- Cost analytics engine
- Vendor telemetry upload as a default workflow

AgentInspect **complements** LangSmith, Langfuse, Braintrust, Phoenix/OpenInference, OpenTelemetry, New Relic, Datadog, and similar platforms. It does not replace their production or eval workflows.

---

## Maintainer release trains

Maintainers ship **small validated chunks** but publish **fewer npm releases** by grouping work into trains. Do not version bump or publish per chunk.

| Train | Status | Guide |
| ----- | ------ | ----- |
| **v1.2.0** — Unified persisted InspectEvent | **Released** 2026-06-11 | [V1.2.0-RELEASE-READINESS.md](docs/implementation/V1.2.0-RELEASE-READINESS.md) |
| **v1.3.0** — Correlation, redaction profiles, LangChain streaming | **Released** 2026-06-12 | [V1.3.0-RELEASE-READINESS.md](docs/implementation/V1.3.0-RELEASE-READINESS.md) |
| **v1.4.0** — CI artifacts, timeline, stats, search | **Released** 2026-06-12 | [V1.4.0-RELEASE-READINESS.md](docs/implementation/V1.4.0-RELEASE-READINESS.md) |
| **v1.5.0** — API boundary, what/report, dual-format read | **Released** 2026-06-24 | [V1.5.0-RELEASE-READINESS.md](docs/implementation/V1.5.0-RELEASE-READINESS.md) |
| **v1.5 corrective train** — internal fixes after v1.5.0 | **Complete on main; not a publish target by default** | [V1.5.1-RELEASE-READINESS.md](docs/implementation/V1.5.1-RELEASE-READINESS.md) |
| **v1.6.0** — Runtime foundation + universal ingestion | **Released** 2026-06-25 | [V1.6.0-RELEASE-READINESS.md](docs/implementation/release-trains/V1.6.0-RELEASE-READINESS.md) |
| **v1.7.0** — Framework-native adoption | **Released** 2026-06-26 | [V1.7.0-RELEASE-READINESS.md](docs/implementation/release-trains/V1.7.0-RELEASE-READINESS.md) |
| **v2.0** — Stable trace contract | Future | [ROADMAP-EXECUTION-V1.5-TO-V2.md](docs/implementation/ROADMAP-EXECUTION-V1.5-TO-V2.md) |

**Publish gate:** release-train readiness validation (`pnpm compat:smoke`, `pnpm pack:smoke`, README/CHANGELOG alignment) plus explicit maintainer publish instruction.

---

## How to contribute to the roadmap

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md).
2. Comment on a live issue or open one using a [template](.github/ISSUE_TEMPLATE/).
3. Prefer small PRs aligned with **Now** before proposing **Future** scope.

Maintainers triage against product boundaries in [docs/community/PROJECT-VISION.md](docs/community/PROJECT-VISION.md).
