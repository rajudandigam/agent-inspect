# Limitations

This document states what AgentInspect **does not** provide today. It complements [KNOWN-ISSUES.md](./KNOWN-ISSUES.md).

## Product boundaries

- **No SaaS dashboard** or hosted multi-tenant product in the open-source core workflow.
- **No production APM replacement**: no sampling agents, no fleet-wide aggregation, no uptime SLAs.
- **No vendor upload pipeline**: no built-in Langfuse/Braintrust/New Relic/Datadog direct exporters as live sinks.
- **No automatic universal instrumentation** of every framework: integration is explicit (manual traces, log ingest, optional adapters).

## Data fidelity

- **No full prompt/output capture by default** for manual traces (by design: safety and PII risk).
- **Log-derived runs** and **manual JSONL traces** may differ in fidelity (timestamps, nesting, confidence).
- **Confidence labels** qualify inferred relationships; they do not guarantee correctness.

## Execution semantics

- **No replay / fork** of past runs from traces alone.
- **No time-travel debugging** across arbitrary runtime state.
- **No multi-run statistical evaluation** built into core.

## Economics

- **No cost engine**: no pricing tables, invoice-grade usage, or provider billing reconciliation.

## Scale

- Designed for **developer machines** and **inner-loop debugging**, not petabyte log warehouses.

For roadmap intent, see [docs/roadmap/VERSION-ROADMAP.md](./roadmap/VERSION-ROADMAP.md) and the v1.0 PRD (future stabilization—not a promise of license/feature commitments).
