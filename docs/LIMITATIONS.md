# Limitations

This document states what AgentInspect **does not** provide today. It complements [KNOWN-ISSUES.md](./KNOWN-ISSUES.md).

## Product boundaries

- **No SaaS dashboard** or hosted multi-tenant product in the open-source core workflow.
- **No production APM replacement**: no sampling agents, no fleet-wide aggregation, no uptime SLAs.
- **No vendor upload pipeline**: no built-in Langfuse/Braintrust/New Relic/Datadog direct exporters as live sinks.
- **No automatic universal instrumentation** of every framework: integration is explicit (manual traces, log ingest, optional adapters).

## Persisted event model (v1.2.0 foundation)

- **v0.2 is not the default persisted trace file format.** `inspectRun()` / `step()` still write `schemaVersion: "0.1"` JSONL.
- **CLI commands** (`list`, `view`, `export`, `diff`, `logs`, `tail`) still primarily operate on current v0.1 trace and log paths.
- **v0.2 read/write integration** (dual-format storage, CLI consumption) is future work — v1.2.0 ships in-memory converters and canonical fixtures only.

## Data fidelity

- **No full prompt/output capture by default** for manual traces (by design: safety and PII risk).
- **Log-derived runs** and **manual JSONL traces** may differ in fidelity (timestamps, nesting, confidence).
- **Confidence labels** qualify inferred relationships; they do not guarantee correctness.

## Trace safety bounds

- **Default metadata redaction** covers common sensitive keys only (exact key match, case-insensitive). Custom secret field names are not redacted unless you add rules via `redact: { rules: [...] }`.
- **Metadata truncation** applies to string values and nested structures; very large metadata may be replaced with a truncation marker when `maxEventBytes` is exceeded (default 64 KiB per JSONL line).
- **Redaction is not encryption.** Local trace files remain readable on disk; treat `.agent-inspect-runs/` like any developer artifact that may contain operational data.

## Execution semantics

- **No replay / fork** of past runs from traces alone.
- **No time-travel debugging** across arbitrary runtime state.
- **No multi-run statistical evaluation** built into core.

## Economics

- **No cost engine**: no pricing tables, invoice-grade usage, or provider billing reconciliation.

## Scale

- Designed for **developer machines** and **inner-loop debugging**, not petabyte log warehouses.

For roadmap intent, see [ROADMAP.md](../ROADMAP.md) (direction only — not a delivery guarantee).
