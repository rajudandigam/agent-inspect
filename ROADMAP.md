# AgentInspect roadmap

AgentInspect is a **local-first execution-tree debugger** for TypeScript AI agents. This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) and [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) for current boundaries.

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · no vendor upload by default · no SaaS/dashboard scope.

---

## Now

Focus: production-hardening the v1.x local debugging foundation without expanding into hosted observability.

| Area | Intent |
| ---- | ------ |
| **Package CJS/ESM compatibility** | Improve conditional type exports and consumer DX for both `import` and `require` without breaking the published tarball layout. |
| **`enabled` / `maybeInspectRun` ergonomics** | Optional opt-out and convenience helpers for environments where tracing should be conditional (dev-only, feature flags) — without changing default safe tracing behavior unless explicitly configured. |
| **Manual metadata redaction** | Redact sensitive `inspectRun` / `step` metadata before writing JSONL to disk. |
| **Event size bounds** | Guardrails on trace event payload size to prevent runaway disk use from accidental large metadata. |
| **LangChain JSONL persistence** | Optional path to persist `@agent-inspect/langchain` callback events into local JSONL traces (experimental adapter surface). |
| **Docs and examples** | Recipes, fixtures, FAQ, and comparison content that help real teams adopt local inspection faster. |

Draft issues: [.github/ISSUE_DRAFTS/](.github/ISSUE_DRAFTS/)

---

## Next

Focus: integrations and CLI workflows that deepen local inspection — still no vendor sinks in core.

| Area | Intent |
| ---- | ------ |
| **Logging integrations** | pino, log4js JSON layout, NestJS structured logging recipes and docs. |
| **CI reporters** | Vitest (and similar) reporter proposals for local trace artifacts in CI logs. |
| **`timeline` command** | CLI view oriented around chronological event timelines (especially log-derived runs). |
| **`stats` command** | Lightweight local aggregates (step counts, durations, error rates) without a dashboard. |
| **Decision metadata & trace-to-eval** | Recipes and metadata patterns for branching/decisions; local export patterns useful for human review (not a hosted eval platform). |

---

## Future

Exploratory — requires design review and explicit scope approval before implementation.

| Area | Intent |
| ---- | ------ |
| **Vercel AI SDK adapter** | Optional callback-style adapter (similar philosophy to LangChain: metadata-first, no vendor sink). |
| **Standards hardening** | Tighter OpenInference / OTLP JSON validation and fixture-backed compatibility notes. |
| **Experimental OTLP HTTP sink** | Opt-in, clearly experimental, local-or-explicit-endpoint only — not a default upload pipeline. |
| **Stable v2 trace contract** | Major-version evolution only if additive `0.1` constraints become insufficient; migration guide required. |

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
