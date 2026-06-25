# Limitations

This document states what AgentInspect **does not** provide today. It complements [KNOWN-ISSUES.md](./KNOWN-ISSUES.md).

## Product boundaries

- **No SaaS dashboard** or hosted multi-tenant product in the open-source core workflow.
- **No production APM replacement**: no sampling agents, no fleet-wide aggregation, no uptime SLAs.
- **No vendor upload pipeline**: no built-in Langfuse/Braintrust/New Relic/Datadog direct exporters as live sinks.
- **No automatic universal instrumentation** of every framework: integration is explicit (manual traces, log ingest, optional adapters).

## Correlation metadata (v1.3.0)

- **`list` / `view` / `export`** do not filter by correlation fields yet — `stats --correlation-id` / `--group-id` and `search` provide targeted read paths; full CLI filtering remains incremental.

## Persisted event model (v1.2.0 foundation)

- **v0.2 is not the default persisted trace file format.** `inspectRun()` / `step()` still write `schemaVersion: "0.1"` JSONL.
- **Dual-format inspection is a read path, not a write migration.** `list`, `view`, `timeline`, `stats`, `search`, `diff`, `export`, `what`, and `report` read v0.1/v0.2 trace files through normalization where applicable. `logs` and `tail` remain structured-log ingestion commands, not v0.2 writers.
- **Default write path remains v0.1.** v0.2 fixtures and converters are available for adapters and migration testing, but AgentInspect does not automatically rewrite traces.

## Runtime writers and universal readers (v1.6)

- **Experimental APIs:** `agent-inspect/writers`, `agent-inspect/readers`, and `createInspector()` are available for local adoption, but their experimental contracts may be refined in v1.x.
- **Explicit writer ownership:** `createInspector()` does not print terminal lifecycle output or implicitly choose a disk writer. Use `fileWriter()` / `bufferedFileWriter()` / custom writers when persistence is desired.
- **No standards upload:** OpenInference and OTLP JSON support is local read/export compatibility only. There is no OTLP gRPC/HTTP streaming sink, collector client, or hosted ingestion behavior.
- **Conservative detection:** `agent-inspect open` does not silently accept arbitrary JSON. Unsupported or ambiguous inputs produce errors/warnings rather than guessed traces.
- **Large inputs:** reader inputs are bounded and read into local memory. This is not a database index or production log warehouse.

## LangChain streaming (v1.3.0)

- **Metadata-focused only** — `stream: true` records chunk counts, timing, and optional bounded previews; it is **not** a replay/cassette system.
- **No full token stream storage by default** — even with `stream: true`, `capture: "metadata-only"` does not persist raw streamed text.
- **No per-token JSONL events** — streaming does not emit one trace line per token.

## Data fidelity

- **No full prompt/output capture by default** for manual traces (by design: safety and PII risk).
- **Log-derived runs** and **manual JSONL traces** may differ in fidelity (timestamps, nesting, confidence).
- **Confidence labels** qualify inferred relationships; they do not guarantee correctness.

## Trace safety bounds

- **Redaction profiles** (`local`, `share`, `strict`) are key-based presets — not compliance-grade PII detection. Review exports before sharing even with `--redaction-profile strict`.
- **Default metadata redaction** covers common sensitive keys only (exact key match, case-insensitive). Custom secret field names are not redacted unless you add rules via `redact: { rules: [...] }`.
- **Metadata truncation** applies to string values and nested structures; very large metadata may be replaced with a truncation marker when `maxEventBytes` is exceeded (default 64 KiB per JSONL line).
- **Redaction is not encryption.** Local trace files remain readable on disk; treat `.agent-inspect-runs/` like any developer artifact that may contain operational data.

## Execution semantics

- **No replay / fork** of past runs from traces alone.
- **No time-travel debugging** across arbitrary runtime state.
- **No multi-run statistical evaluation** built into core.

## Economics

- **No cost engine**: no pricing tables, invoice-grade usage, or provider billing reconciliation.
- **Token usage is supplied metadata only**: AgentInspect may display `input`, `output`, `total`, and `cached` counts when callers/adapters provide them; core does not count tokens or infer provider billing.

## Local observability commands (v1.4.0)

- **`timeline`**, **`stats`**, and **`search`** scan local JSONL files — no database index; large directories may be slow.
- **`search`** is deterministic exact/contains matching only — no semantic or fuzzy search.
- **`stats`** is local file aggregation — not production fleet analytics.

Visual demos: [SCREENSHOTS.md](./SCREENSHOTS.md) · [CLI.md](./CLI.md)

## Scale

- Designed for **developer machines** and **inner-loop debugging**, not petabyte log warehouses.

For roadmap intent, see [ROADMAP.md](../ROADMAP.md) (direction only — not a delivery guarantee).
