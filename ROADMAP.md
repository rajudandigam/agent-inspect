# Roadmap

AgentInspect is the **local-first trace workbench** for TypeScript AI agents — understand, debug, compare, annotate, and export agent runs locally before you need a hosted observability platform.

This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) and [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) for current boundaries.

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · framework-aware but not framework-locked · no vendor upload by default · no SaaS/dashboard scope.

**Current release on npm:** [1.1.0](CHANGELOG.md#110) (`agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`). **v1.1.1** compatibility hardening may exist on `main` locally but is **not published** until a changeset release. **v1.2.0** is **in progress (not published)** — design complete; implementation chunks PR 2–8 per [execution guide](docs/implementation/CURSOR-MAINTAINER-ROADMAP.md).

---

## Released recently

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

Focus: validate **1.1.0 compatibility** in real consumer environments (ESM, CJS, Jest-style tests), support **current OSS issue batches**, **design LangChain streaming** ([#14](https://github.com/rajudandigam/agent-inspect/issues/14)), **plan CI trace artifacts** ([#24](https://github.com/rajudandigam/agent-inspect/issues/24)), and **collect feedback** — without expanding SaaS or vendor-upload scope.

**OSS Activation Batch 01** ([#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen)) · **Batch 02** ([#18–#30](https://github.com/rajudandigam/agent-inspect/issues/18)) — contributor docs, recipes, fixtures, and design RFCs. **Batch 03 waits** until Batch 02 receives comments or PRs.

Curated entry points: [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md) · source bodies: `.github/LIVE_ISSUE_BATCH_01/` · `.github/LIVE_ISSUE_BATCH_02/`

| Area | Intent |
| ---- | ------ |
| **Validate 1.1.0 compatibility** | `pnpm compat:smoke`, `pnpm pack:smoke`, ESM/CJS/Jest-style consumer fixtures — see [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md#common-installruntime-compatibility-checks). |
| **Support contributor issues** | Triage and review PRs for [#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen) and [#18–#30](https://github.com/rajudandigam/agent-inspect/issues/18); contributors should comment before opening PRs. |
| **Design LangChain streaming** | Maintainer-owned RFC ([#14](https://github.com/rajudandigam/agent-inspect/issues/14)) — metadata-only defaults, size bounds; no implementation in v1.1.1. |
| **Plan CI trace artifacts** | Recipes and reporter proposals ([#24](https://github.com/rajudandigam/agent-inspect/issues/24)) — local artifacts only, no upload pipeline. |
| **Collect feedback** | [Discussions](https://github.com/rajudandigam/agent-inspect/discussions) and issues — map to Next/Future without delivery promises. |
| **Unified persisted InspectEvent model (~v1.2)** | **PR 1 done:** [design](docs/proposals/UNIFIED-PERSISTED-INSPECT-EVENT.md) + [checklist](docs/proposals/UNIFIED-PERSISTED-INSPECT-EVENT-CHECKLIST.md). **PR 2–8** implementation train — maintainer-owned; OSS batches [#7–#30](https://github.com/rajudandigam/agent-inspect/issues/18) remain parallel. |

Activation helpers: [docs/community/OUTREACH-TEMPLATES.md](docs/community/OUTREACH-TEMPLATES.md) · [docs/community/CONTRIBUTOR-ROLES.md](docs/community/CONTRIBUTOR-ROLES.md) · [docs/community/DISCUSSIONS-STARTERS.md](docs/community/DISCUSSIONS-STARTERS.md)

---

## Next

Focus: deepen local inspection workflows — still no vendor sinks in core.

| Area | Intent | Direction (non-committal) |
| ---- | ------ | ------------------------- |
| **LangChain streaming** | Design and optional support for streaming callbacks (experimental surface). Track [#14](https://github.com/rajudandigam/agent-inspect/issues/14). | ~v1.2.x |
| **Redaction profiles** | Named presets for metadata redaction beyond default keys — local-first, opt-in. | ~v1.2.x |
| **CI reporters** | Vitest (and similar) reporters for local trace artifacts in CI logs. Track [#24](https://github.com/rajudandigam/agent-inspect/issues/24). | ~v1.3.x |
| **NestJS integration** | Deeper recipes or optional helper patterns beyond logging playbook. | ~v1.3.x |
| **`timeline` / `stats` / cohort views** | CLI views for chronological timelines and lightweight aggregates — no dashboard. Track [#11](https://github.com/rajudandigam/agent-inspect/issues/11), [#12](https://github.com/rajudandigam/agent-inspect/issues/12). | ~v1.3.x |
| **Unified persisted InspectEvent model** | Implement proposal PRs 2–4 (types, storage, CLI); `0.1` traces remain readable. | ~v1.2.0 |
| **Decision metadata & trace-to-eval** | Recipes and metadata patterns for branching/decisions; local export for human review. Track [#13](https://github.com/rajudandigam/agent-inspect/issues/13). | ~v1.4.x |

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
| **v1.2.0** — Unified persisted InspectEvent | Design done; implementation PR 2–8 pending | [CURSOR-MAINTAINER-ROADMAP.md](docs/implementation/CURSOR-MAINTAINER-ROADMAP.md) |
| **v1.3.0** — LangChain streaming, correlation, redaction profiles | Planned | Same guide §4 |
| **v1.4.0** — CI artifacts, timeline, stats | Planned | Same guide §4 |
| **v2.0** — Stable trace contract | Future | Same guide §4 |

**Publish gate:** release-train readiness validation (`pnpm compat:smoke`, `pnpm pack:smoke`, README/CHANGELOG alignment) plus explicit maintainer publish instruction.

---

## How to contribute to the roadmap

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md).
2. Comment on a live issue or open one using a [template](.github/ISSUE_TEMPLATE/).
3. Prefer small PRs aligned with **Now** before proposing **Future** scope.

Maintainers triage against product boundaries in [docs/community/PROJECT-VISION.md](docs/community/PROJECT-VISION.md).
