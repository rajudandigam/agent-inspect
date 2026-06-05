# Roadmap

AgentInspect is a **local-first execution-tree debugger** for TypeScript AI agents. This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) and [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) for current boundaries.

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · no vendor upload by default · no SaaS/dashboard scope.

---

## Released / Completed recently

Work landed in the v1.1 preparation cycle (see [CHANGELOG.md](CHANGELOG.md) **1.1.0 — Unreleased**):

- **Production package compatibility:** ESM/CJS conditional type exports (`import.types` / `require.types`).
- **Runtime adoption ergonomics:** `enabled` option on `inspectRun` and `maybeInspectRun()` with `AGENT_INSPECT` env gating.
- **Safety hardening:** manual metadata redaction before disk (default on; `redact: false` opt-out) and persisted event size bounds.
- **LangChain persistence:** optional JSONL traces via `@agent-inspect/langchain` when `persist: true` (experimental adapter).
- **Logging adoption:** [docs/LOGGING-PLAYBOOK.md](docs/LOGGING-PLAYBOOK.md) plus pino, log4js, and NestJS JSON logging recipes and fixtures.
- **Community readiness:** contributing docs, issue templates, good-first-issue guidance, and issue drafts.

LangChain and TUI programmatic APIs remain **experimental**. JSON logs remain first-class; log4js parsing remains best-effort.

---

## Now

Focus: final pre-release polish before the 1.1.0 changelog and release pass.

| Area | Intent |
| ---- | ------ |
| **Pre-release docs cleanup** | Align public docs with shipped behavior (exports, redaction, LangChain persistence, logging playbook). |
| **Changelog and release notes** | Prepare the 1.1.0 section and maintainer release checklist. |
| **Issue draft conversion** | Convert selected `.github/ISSUE_DRAFTS/` into live GitHub issues. |
| **Package validation** | Final `pnpm test:all`, `npm pack --dry-run`, and smoke checks. |

Draft issues: [.github/ISSUE_DRAFTS/](.github/ISSUE_DRAFTS/)

---

## Next

Focus: integrations and CLI workflows that deepen local inspection — still no vendor sinks in core.

| Area | Intent |
| ---- | ------ |
| **Unified persisted InspectEvent model** | Align manual JSONL and adapter-persisted events where schema gaps remain. |
| **LangChain streaming** | Design and optional support for streaming callbacks (experimental surface). |
| **`timeline` command** | CLI view oriented around chronological event timelines (especially log-derived runs). |
| **`stats` command** | Lightweight local aggregates (step counts, durations, error rates) without a dashboard. |
| **CI reporters / artifacts** | Vitest (and similar) reporter proposals for local trace artifacts in CI logs. |
| **Decision metadata & trace-to-eval** | Recipes and metadata patterns for branching/decisions; local export patterns useful for human review (not a hosted eval platform). |

---

## Future

Exploratory — requires design review and explicit scope approval before implementation.

| Area | Intent |
| ---- | ------ |
| **Vercel AI SDK adapter** | Optional callback-style adapter (similar philosophy to LangChain: metadata-first, no vendor sink). |
| **Standards hardening** | Tighter OpenInference / OTLP JSON validation and fixture-backed compatibility notes. |
| **Experimental OTLP HTTP sink** | Opt-in, clearly experimental, local-or-explicit-endpoint only — not a default upload pipeline. |
| **Stable v2 trace contract** | Major-version evolution only if additive `0.1` constraints become insufficient; stable trace contract and adapter/exporter/sink APIs for v2.0 with migration guide. |

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
2. Open an issue using a [template](.github/ISSUE_TEMPLATE/) or comment on an existing draft.
3. Prefer small PRs aligned with **Now** before proposing **Future** scope.

Maintainers triage against product boundaries in [docs/community/PROJECT-VISION.md](docs/community/PROJECT-VISION.md).
