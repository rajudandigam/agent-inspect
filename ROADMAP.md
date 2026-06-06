# Roadmap

AgentInspect is the **local-first trace workbench** for TypeScript AI agents — understand, debug, compare, annotate, and export agent runs locally before you need a hosted observability platform.

This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) and [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) for current boundaries.

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · framework-aware but not framework-locked · no vendor upload by default · no SaaS/dashboard scope.

**Current release:** [1.1.0](CHANGELOG.md#110) on npm (`agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`).

---

## Released recently

Shipped in **1.1.0** (see [CHANGELOG.md](CHANGELOG.md#110)):

- **Production package compatibility:** ESM/CJS conditional type exports (`import.types` / `require.types`).
- **Runtime adoption ergonomics:** `enabled` option on `inspectRun` and `maybeInspectRun()` with `AGENT_INSPECT` env gating.
- **Safety hardening:** manual metadata redaction before disk (default on; `redact: false` opt-out) and persisted event size bounds.
- **LangChain persistence:** optional JSONL traces via `@agent-inspect/langchain` when `persist: true` (experimental adapter).
- **Logging adoption:** [docs/LOGGING-PLAYBOOK.md](docs/LOGGING-PLAYBOOK.md) plus pino, log4js, and NestJS JSON logging recipes and fixtures.
- **Community readiness:** contributing docs, issue templates, good-first-issue guidance, and issue drafts.

LangChain and TUI programmatic APIs remain **experimental**. JSON logs remain first-class; log4js parsing remains best-effort.

---

## Now

Focus: open-source activation after the 1.1.0 publish — validate the release, triage live issues, enable Discussions, and collect feedback.

| Area | Intent |
| ---- | ------ |
| **Validate 1.1.0** | Confirm npm install, CLI help, ESM/CJS TypeScript import, and tarball smoke in clean temp projects. |
| **First live GitHub issues** | Batch 01 open ([#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen); see [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md)). Source bodies: `.github/LIVE_ISSUE_BATCH_01/`. |
| **Enable GitHub Discussions** | Turn on Discussions; pin stack survey (see [docs/community/DISCUSSIONS-STARTERS.md](docs/community/DISCUSSIONS-STARTERS.md)). |
| **Collect feedback** | Learn from TypeScript AI developers using manual traces, logs, LangChain adapter, and exports. |
| **Unified persisted InspectEvent design** | Start design for aligning manual JSONL and adapter-persisted events (maintainer-led; contributor-friendly docs/fixtures welcome). |

Activation helpers: [docs/community/OUTREACH-TEMPLATES.md](docs/community/OUTREACH-TEMPLATES.md) · [docs/community/CONTRIBUTOR-ROLES.md](docs/community/CONTRIBUTOR-ROLES.md)

---

## Next

Focus: deepen local inspection workflows — still no vendor sinks in core.

| Area | Intent | Direction (non-committal) |
| ---- | ------ | ------------------------- |
| **Unified persisted InspectEvent model** | Align manual JSONL and adapter-persisted events where schema gaps remain. | ~v1.2.0 |
| **LangChain streaming** | Design and optional support for streaming callbacks (experimental surface). Track [#14](https://github.com/rajudandigam/agent-inspect/issues/14). | ~v1.2.1 |
| **`timeline` command** | CLI view oriented around chronological event timelines (especially log-derived runs). Track [#11](https://github.com/rajudandigam/agent-inspect/issues/11). | ~v1.3.0 |
| **`stats` command** | Lightweight local aggregates (step counts, durations, error rates) without a dashboard. Track [#12](https://github.com/rajudandigam/agent-inspect/issues/12). | ~v1.3.0 |
| **CI trace artifacts** | Vitest (and similar) reporter proposals for local trace artifacts in CI logs. | ~v1.4.0 |
| **Decision metadata & trace-to-eval** | Recipes and metadata patterns for branching/decisions; local export for human review (not a hosted eval platform). Track [#13](https://github.com/rajudandigam/agent-inspect/issues/13). | ~v1.5.0 |

---

## Future

Exploratory — requires design review and explicit scope approval before implementation.

| Area | Intent | Direction (non-committal) |
| ---- | ------ | ------------------------- |
| **Optional logging integration packages** | pino / log4js / NestJS helper packages beyond recipes (if justified). | ~v1.6.0 |
| **Vercel AI SDK adapter** | Optional callback-style adapter (metadata-first, no vendor sink). | ~v1.7.0 |
| **Standards hardening** | OpenInference / OTLP / Phoenix fixture-backed compatibility notes. | ~v1.8.0 |
| **Experimental OTLP HTTP sink** | Opt-in, local-or-explicit-endpoint only — not a default upload pipeline. | ~v1.9.0 |
| **Stable v2 trace contract** | Major-version evolution if additive `0.1` constraints become insufficient; migration guide required. | v2.0 |

---

## Explicit non-goals (all phases)

- SaaS backend or multi-tenant hosted product
- Production APM replacement (sampling agents, fleet aggregation, SLAs)
- Web dashboard as a core deliverable
- Automatic universal framework instrumentation without explicit integration
- Replay / fork execution from traces
- Cost analytics engine
- Vendor telemetry upload as a default workflow

AgentInspect **complements** LangSmith, Langfuse, Braintrust, Phoenix/OpenInference, OpenTelemetry, New Relic, Datadog, and similar platforms. It does not replace their production or eval workflows.

---

## How to contribute to the roadmap

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md).
2. Comment on a live issue or open one using a [template](.github/ISSUE_TEMPLATE/).
3. Prefer small PRs aligned with **Now** before proposing **Future** scope.

Maintainers triage against product boundaries in [docs/community/PROJECT-VISION.md](docs/community/PROJECT-VISION.md).
