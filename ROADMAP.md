# Roadmap

AgentInspect is the **local-first trace workbench** for TypeScript AI agents — understand, debug, compare, annotate, and export agent runs locally before you need a hosted observability platform.

**Product loop:** framework event → local JSONL → inspect / report / diff → CI artifact → optional standards export.

This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) and [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) for current boundaries.

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · framework-aware but not framework-locked · no vendor upload by default · no SaaS/dashboard scope.

**Current release on npm:** **3.5.5** — sixteen linked public packages including `agent-inspect`, framework adapters, reporters, redact, eval, mcp, guardrails, circuit, viewer, mcp-server, harness, and adapter-sdk. Persisted trace schema **1.0**. See [CHANGELOG.md](CHANGELOG.md#355).

**Active direction (post-v3.5):** **OSS contributor activation** around the shipped v3 trace workbench plus **v4 workspace planning** — the next phase evolves AgentInspect from a broad local toolkit into a focused local and self-hosted trace workspace. v3.1→v3.5 train complete — see [CHANGELOG.md](CHANGELOG.md#355). Long-term direction: [docs/implementation/ROADMAP_V3_5_TO_V7.md](docs/implementation/ROADMAP_V3_5_TO_V7.md).

**Core product gap (maintainer-owned):** one unified persisted run model across manual traces, structured logs, framework callbacks, CI artifacts, and standards exports — not a contributor starter issue.

---

## Released recently

Shipped in **2.0.0** (see [CHANGELOG.md](CHANGELOG.md#200)):

- **Stable trace contract:** small stable root API, schema 1.0 persisted writer path, and explicit migration workflow.
- **Reader compatibility:** v0.1, v0.2, and v1.0 local AgentInspect traces remain readable.
- **Migration safety:** trace migration is explicit and non-destructive; no in-place rewrite or automatic replay behavior was added.
- **Linked release:** `agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, `@agent-inspect/tui`, and `@agent-inspect/openai-agents` at **2.0.0**.
- **Unchanged by design:** local-first, no vendor upload, no hosted dashboard, and no raw chain-of-thought capture.

Shipped in **1.9.0** (see [CHANGELOG.md](CHANGELOG.md#190)):

- **Adoption leverage:** private harness workspace foundation, explain dry-run/local analysis, and adapter promotion.
- **v2 preparation:** root API slimming plan and contract checks for the v2 stable API reset.
- **Linked release:** `agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, `@agent-inspect/tui`, and `@agent-inspect/openai-agents` at **1.9.0**.
- **Unchanged by design:** optional integrations remain package-scoped and local-first.

Shipped in **1.8.0** (see [CHANGELOG.md](CHANGELOG.md#180)):

- **Deterministic checks:** experimental `agent-inspect/checks` rule engine and local `agent-inspect check` workflows.
- **Safe sharing workflows:** `scan`, `verify-safe`, and structural artifact generation for local CI outputs.
- **OpenAI Agents adapter:** first public `@agent-inspect/openai-agents` package for local OpenAI Agents JS trace processing.
- **CI evidence:** deterministic release-train gates, package smoke coverage, and compatibility smoke coverage.
- **Private by design:** Vitest and Jest reporter packages remain workspace-private until a later explicit release step.
- **Linked release:** `agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, `@agent-inspect/tui`, and `@agent-inspect/openai-agents` at **1.8.0**.
- **Unchanged by design:** local-first, no vendor upload, manual traces remain `schemaVersion: "0.1"`.

Shipped in **1.7.0** (see [CHANGELOG.md](CHANGELOG.md#170)):

- **AI SDK adapter:** experimental `@agent-inspect/ai-sdk` package for Vercel AI SDK v6 telemetry integrations.
- **Metadata-only local capture:** AI SDK examples use `recordInputs: false`, `recordOutputs: false`, and no default upload behavior.
- **Adapter foundation:** tool/error/streaming coverage, local no-network recipe coverage, and a declarative adapter conformance matrix.
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

## Now — OSS contribution lanes + v4 workspace planning (post-v3.5)

Focus contributor work on **activation** around the shipped v3 system, while maintainers begin **v4 workspace planning** (see the canonical [v3.5→v7 roadmap](docs/implementation/ROADMAP_V3_5_TO_V7.md)). This is not another v1/v2 feature roadmap. Curated entry: [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md) · Contributor lanes: [docs/community/CONTRIBUTOR-LANES.md](docs/community/CONTRIBUTOR-LANES.md) · OSS roadmap: [docs/community/OSS-ROADMAP.md](docs/community/OSS-ROADMAP.md)

| Lane | Intent | Example live issues |
| ---- | ------ | ------------------- |
| **OSS Hygiene** | Onboarding, roadmap/docs alignment, doctor messages | [#9](https://github.com/rajudandigam/agent-inspect/issues/9), [#18](https://github.com/rajudandigam/agent-inspect/issues/18), [#19](https://github.com/rajudandigam/agent-inspect/issues/19), [#67](https://github.com/rajudandigam/agent-inspect/issues/67) |
| **Examples and Fixtures** | Recipes, cookbooks, fixture packs, streaming docs | [#10](https://github.com/rajudandigam/agent-inspect/issues/10), [#13](https://github.com/rajudandigam/agent-inspect/issues/13), [#27](https://github.com/rajudandigam/agent-inspect/issues/27), [#29](https://github.com/rajudandigam/agent-inspect/issues/29), [#69](https://github.com/rajudandigam/agent-inspect/issues/69) |
| **Adapter SDK Examples** | Third-party adapter examples, privacy checklist, transforms/renderers | [#60](https://github.com/rajudandigam/agent-inspect/issues/60)–[#64](https://github.com/rajudandigam/agent-inspect/issues/64) |
| **UI and Performance Polish** | VS Code docs, performance fixtures, viewer onboarding | [#65](https://github.com/rajudandigam/agent-inspect/issues/65)–[#66](https://github.com/rajudandigam/agent-inspect/issues/66), [#68](https://github.com/rajudandigam/agent-inspect/issues/68) |
| **Standards and Graduation** | OpenInference/OTLP fixtures, Phoenix import guides | [#7](https://github.com/rajudandigam/agent-inspect/issues/7), [#25](https://github.com/rajudandigam/agent-inspect/issues/25) |

**Maintainer-owned (not good-first):** unified persisted InspectEvent model, schema evolution, redaction/security internals, package export policy, official adapter internals, OTLP sink architecture, release process.

**Recently shipped (closed issues):** timeline/stats CLI (1.4.0), CI artifact recipe, `@agent-inspect/ai-sdk`, Winston/logging recipes, install smoke guide, safe trace sharing checklist — see [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md#shipped-closed--do-not-reopen).

Activation helpers: [docs/community/OUTREACH-TEMPLATES.md](docs/community/OUTREACH-TEMPLATES.md) · [docs/community/CONTRIBUTOR-ROLES.md](docs/community/CONTRIBUTOR-ROLES.md) · [docs/community/MONTHLY-OSS-HYGIENE.md](docs/community/MONTHLY-OSS-HYGIENE.md)

---

## Next

Published sequence after **v2.0.0** — directional, not delivery guarantees.

| Release | Area | Intent |
| ------- | ---- | ------ |
| **v2.1.0** | Eval/redact utility triangle | Public optional eval and redact utilities, shared redaction engine, and deterministic local eval workflows. |
| **v2.2.0** | Reporters and CI | Public Vitest/Jest reporters, CI summaries, trace/eval artifacts, and quiet success mode. |
| **v2.3.0** | Adapter hardening | AI SDK, OpenAI Agents, and LangGraph-through-LangChain polish; new adapters only when demand is proven. |
| **v2.4.0** | Sessions and MCP telemetry | Session navigation, handoffs, retries, sub-agents, and MCP client tool tracing without becoming a gateway product. |
| **v2.5.0** | Guardrails and circuit breakers | Deterministic local safety utilities built on checks, redaction, eval, and trace events. |
| **v2.6.0** | Optional viewer and IDE/MCP surfaces | Local read-only viewer, read-only MCP server, and optional editor surfaces if user demand is proven. |

---

## Future

Exploratory — requires design review and explicit scope approval before implementation.

| Area | Intent | Direction (non-committal) |
| ---- | ------ | ------------------------- |
| **Explain experiment** | Opt-in natural-language trace summaries — no version until maintainer approves scope. | conditional |
| **Experimental OTLP HTTP sink** | Opt-in, local-or-explicit-endpoint only — not a default upload pipeline. | post-v2 exploratory |
| **Optional cassette / replay research** | Exploratory only if community demand appears — not a default replay engine. | TBD |
| **v3.0.0 conditional extensibility** | Stable extension ecosystem only if v2 adoption proves recurring reporter/check workflows, compatible third-party traces, and demand for extension points. | conditional |

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

## Maintainer notes

**Current npm release:** 3.5.5. Operational state: [docs/implementation/RELEASE-TRAIN-STATE.md](docs/implementation/RELEASE-TRAIN-STATE.md).

The v3.1→v3.5 feature train is **complete**. Post-v3.5 work follows the adoption plan in [POST-V3.5-ADOPTION-PLAN.md](docs/implementation/POST-V3.5-ADOPTION-PLAN.md) plus v4 workspace planning in the canonical [v3.5→v7 roadmap](docs/implementation/ROADMAP_V3_5_TO_V7.md) — no version bumps or publishes without explicit maintainer authorization.

Historical release train readouts (v1.2–v3.4 publication evidence, execution plans, and agent prompts) live under [docs/archive/implementation/](docs/archive/implementation/). Active v3.5 publication records: [docs/implementation/release-trains/](docs/implementation/release-trains/).

**Publish gate:** `pnpm compat:smoke`, `pnpm pack:smoke`, README/CHANGELOG alignment, plus explicit maintainer publish instruction.

---

## How to contribute to the roadmap

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md).
2. Comment on a live issue or open one using a [template](.github/ISSUE_TEMPLATE/).
3. Prefer small PRs aligned with **Now** before proposing **Future** scope.

Maintainers triage against product boundaries in [docs/community/PROJECT-VISION.md](docs/community/PROJECT-VISION.md).
