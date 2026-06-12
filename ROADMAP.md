# Roadmap

AgentInspect is the **local-first trace workbench** for TypeScript AI agents — understand, debug, compare, annotate, and export agent runs locally before you need a hosted observability platform.

This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) and [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) for current boundaries.

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · framework-aware but not framework-locked · no vendor upload by default · no SaaS/dashboard scope.

**Current release on npm:** [1.2.0](CHANGELOG.md#120) (`agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`).

---

## Released recently

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

Focus: **v1.3.0** — correlation metadata (shipped in train), redaction profiles / share-safe exports (current chunk), LangChain streaming design and metadata-only support (next chunk), and **OSS issue batch** triage — without expanding SaaS or vendor-upload scope.

**OSS Activation Batch 01** ([#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen)) · **Batch 02** ([#18–#30](https://github.com/rajudandigam/agent-inspect/issues/18)) — contributor docs, recipes, fixtures, and design RFCs. **Batch 03 waits** until Batch 02 receives comments or PRs.

Curated entry points: [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md) · source bodies: `.github/LIVE_ISSUE_BATCH_01/` · `.github/LIVE_ISSUE_BATCH_02/`

| Area | Intent |
| ---- | ------ |
| **Correlation metadata** | Shipped — `correlationId` / `requestId` / `decisionId` / `groupId` on `run_started` metadata. |
| **Redaction profiles** | In progress — `local` / `share` / `strict` presets; `agent-inspect export --redaction-profile`. |
| **LangChain streaming** | Design and metadata-only streaming support ([#14](https://github.com/rajudandigam/agent-inspect/issues/14)); size bounds; no vendor sink. |
| **Support contributor issues** | Triage and review PRs for [#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen) and [#18–#30](https://github.com/rajudandigam/agent-inspect/issues/18). |
| **Collect feedback** | [Discussions](https://github.com/rajudandigam/agent-inspect/discussions) and issues — map to Next/Future without delivery promises. |

Train guide: [V1.3.0-IMPLEMENTATION-PLAN.md](docs/implementation/V1.3.0-IMPLEMENTATION-PLAN.md) · [V1.3.0-RELEASE-TRAIN.md](docs/implementation/V1.3.0-RELEASE-TRAIN.md) · [CURSOR-MAINTAINER-ROADMAP.md](docs/implementation/CURSOR-MAINTAINER-ROADMAP.md)

Activation helpers: [docs/community/OUTREACH-TEMPLATES.md](docs/community/OUTREACH-TEMPLATES.md) · [docs/community/CONTRIBUTOR-ROLES.md](docs/community/CONTRIBUTOR-ROLES.md) · [docs/community/DISCUSSIONS-STARTERS.md](docs/community/DISCUSSIONS-STARTERS.md)

---

## Next

Focus: deepen local inspection workflows — still no vendor sinks in core.

| Area | Intent | Direction (non-committal) |
| ---- | ------ | ------------------------- |
| **Unified persisted InspectEvent — storage/CLI** | Dual-format read helpers and CLI integration; `0.1` traces remain readable. | post–v1.2.0 |
| **CI reporters** | Vitest (and similar) reporters for local trace artifacts in CI logs. Track [#24](https://github.com/rajudandigam/agent-inspect/issues/24). | ~v1.4.x |
| **NestJS integration** | Deeper recipes or optional helper patterns beyond logging playbook. | ~v1.4.x |
| **`timeline` / `stats` / cohort views** | CLI views for chronological timelines and lightweight aggregates — no dashboard. Track [#11](https://github.com/rajudandigam/agent-inspect/issues/11), [#12](https://github.com/rajudandigam/agent-inspect/issues/12). | ~v1.4.x |
| **Decision metadata & trace-to-eval** | Recipes and metadata patterns for branching/decisions; local export for human review. Track [#13](https://github.com/rajudandigam/agent-inspect/issues/13). | ~v1.5.x |

---

## Future

Exploratory — requires design review and explicit scope approval before implementation.

| Area | Intent | Direction (non-committal) |
| ---- | ------ | ------------------------- |
| **OTel-shaped event model** | Optional alignment with OpenTelemetry-shaped events for local inspection — not a default upload pipeline. | ~v1.5.x |
| **Standards hardening** | OpenInference / OTLP / Phoenix fixture-backed compatibility notes. Track [#25](https://github.com/rajudandigam/agent-inspect/issues/25). | ~v1.6.x |
| **Vercel AI SDK adapter** | Optional callback-style adapter (metadata-first, no vendor sink). Track [#30](https://github.com/rajudandigam/agent-inspect/issues/30) (design). | ~v1.7.x |
| **Experimental OTLP HTTP sink** | Opt-in, local-or-explicit-endpoint only — not a default upload pipeline. | ~v1.8.x |
| **Optional cassette / replay research** | Exploratory only if community demand appears — not a default replay engine. | TBD |
| **Stable v2 trace contract** | Major-version evolution if additive `0.1` constraints become insufficient; migration guide required. | v2.0 |

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

Maintainers ship **small Cursor PR chunks** but publish **fewer npm releases** by grouping work into trains. Do not version bump or publish per chunk.

| Train | Status | Guide |
| ----- | ------ | ----- |
| **v1.2.0** — Unified persisted InspectEvent | **Released** 2026-06-11 | [V1.2.0-RELEASE-READINESS.md](docs/implementation/V1.2.0-RELEASE-READINESS.md) |
| **v1.3.0** — Correlation, redaction profiles, LangChain streaming | **In progress** | [V1.3.0-RELEASE-TRAIN.md](docs/implementation/V1.3.0-RELEASE-TRAIN.md) |
| **v1.4.0** — CI artifacts, timeline, stats | Planned | [CURSOR-MAINTAINER-ROADMAP.md](docs/implementation/CURSOR-MAINTAINER-ROADMAP.md) §4 |
| **v2.0** — Stable trace contract | Future | Same guide §4 |

**Publish gate:** release-train readiness validation (`pnpm compat:smoke`, `pnpm pack:smoke`, README/CHANGELOG alignment) plus explicit maintainer publish instruction.

---

## How to contribute to the roadmap

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md).
2. Comment on a live issue or open one using a [template](.github/ISSUE_TEMPLATE/).
3. Prefer small PRs aligned with **Now** before proposing **Future** scope.

Maintainers triage against product boundaries in [docs/community/PROJECT-VISION.md](docs/community/PROJECT-VISION.md).
