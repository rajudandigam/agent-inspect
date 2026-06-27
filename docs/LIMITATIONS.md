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

- **Manual global tracing remains v0.1.** `inspectRun()` / `step()` still write `schemaVersion: "0.1"` JSONL for compatibility.
- **Persisted writer/runtime output targets schema 1.0.** `createInspector()` with built-in writers emits schema 1.0 persisted rows; v0.2 remains a readable compatibility foundation.
- **Migration is explicit, not automatic.** `agent-inspect migrate <input> --to 1.0 --dry-run` reports what would change, and `--output <file>` writes a separate file. AgentInspect does not rewrite old traces in place.

## Runtime writers and universal readers (v1.6)

- **Subpath APIs:** `agent-inspect/writers`, `agent-inspect/readers`, and advanced helpers are available for local adoption from their owning subpaths. `createInspector()` is part of the small root API.
- **Explicit writer ownership:** `createInspector()` does not print terminal lifecycle output or implicitly choose a disk writer. Use `fileWriter()` / `bufferedFileWriter()` / custom writers when persistence is desired.
- **No standards upload:** OpenInference and OTLP JSON support is local read/export compatibility only. There is no OTLP gRPC/HTTP streaming sink, collector client, or hosted ingestion behavior.
- **Conservative detection:** `agent-inspect open` does not silently accept arbitrary JSON. Unsupported or ambiguous inputs produce errors/warnings rather than guessed traces.
- **Large inputs:** reader inputs are bounded and read into local memory. This is not a database index or production log warehouse.

## Framework adapters (v1.7)

- **AI SDK integration is explicit telemetry wiring.** Use `@agent-inspect/ai-sdk` through AI SDK `experimental_telemetry.integrations`; AgentInspect does not wrap providers, patch fetch, or enable telemetry globally.
- **AI SDK privacy settings are caller-owned.** Examples set `recordInputs: false` and `recordOutputs: false`; leaving those enabled in user code can cause the AI SDK telemetry layer to include richer data before AgentInspect receives events.
- **OpenAI Agents JS support is experimental.** `@agent-inspect/openai-agents` maps metadata-only runtime spans through the safe `setTraceProcessors()` boundary and does not capture raw payloads by default. The v1.9 package publication retry is a separate maintainer npm automation task, not part of the v2 contract work.
- **LangGraph support is a boundary decision, not a separate package.** Initial support is expected through `@agent-inspect/langchain` callbacks unless no-network fixtures prove a separate package is needed.
- **No root/core adapter dependencies.** AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, and LangChain remain outside the root/core runtime dependency graph.

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

## Checks, artifacts, and test reporters

- **Checks are deterministic local rules, not compliance certification.** `check`, `scan`, and `verify-safe` surface bounded findings and diagnostics over supported local inputs; they do not prove a trace is safe for every sharing context.
- **Safe CI artifacts are structural summaries.** They avoid raw prompt/output/request/response/header/tool payload content by default, but teams should still review generated files before sharing.
- **Vitest/Jest reporters are optional package surfaces.** Recipes document config patterns and explicit associations; package publication is controlled by release readiness and maintainer authorization.

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
