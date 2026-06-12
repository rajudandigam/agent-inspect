# Unified persisted InspectEvent model (proposal)

**Status:** Shipped in v1.2.0 (2026-06-11) — in-memory helpers and docs; storage/CLI migration planned for later trains  
**Audience:** Maintainers and contributors coordinating on core schema design  
**Not in scope for this document:** Runtime implementation, CLI changes, or `schemaVersion: "0.1"` write-path changes

---

## 1. Problem statement

AgentInspect today has **multiple event sources** that converge only **in memory** (or via ad hoc adapters) before export, diff, or display:

| Source | Persisted today? | Current shape |
| ------ | ---------------- | ------------- |
| Manual `inspectRun` / `step` | Yes — JSONL `TraceEvent` | `schemaVersion: "0.1"`, four event names |
| Structured JSON logs | No — normalized at read time | In-memory `InspectEvent` |
| log4js-style logs | No — normalized at read time | In-memory `InspectEvent` |
| LangChain callbacks | Optional — re-encoded to `0.1` JSONL | In-memory `InspectEvent`; persistence maps to manual events |
| Future Vercel AI SDK telemetry | Not implemented | — |
| CI trace artifacts | Not implemented | — |
| Standards export (OpenInference / OTLP JSON) | Export-time only | Derived from `InspectRunTree` |

**Consequences of source-specific paths:**

- **Timeline / stats / cohort** commands need a single chronological event stream per run; today manual traces use paired start/complete rows while log-derived runs use one row per logical event.
- **CI artifacts** need a stable, self-describing on-disk format that adapters and manual tracing can both emit.
- **Standards export** already maps `InspectKind` → OpenInference at export time; manual JSONL takes a detour through `manualTraceEventsToRunTree`.
- **Trace-to-eval** and cross-run comparison work better when branching metadata, confidence, and source provenance survive persistence.
- **LangChain persistence** currently **re-encodes** adapter events into legacy `step_started` / `step_completed` rows, losing native adapter fields and duplicating conversion logic.

The goal of v1.2.0 is to **design** one **source-agnostic persisted event model** before changing runtime behavior.

---

## 2. Goals

- **Source-agnostic event model** — one persisted row shape consumable by tree builder, export, diff, timeline, and stats.
- **`schemaVersion: "0.1"` traces remain readable** — no automatic rewriting; readers accept both formats during transition.
- **Additive schema evolution only in v1.x** — new optional fields; no breaking removals.
- **No automatic migration** — old files stay on disk as written.
- **Source type preserved** — `source.type` records manual, log ingest, adapter, etc.
- **Confidence labels preserved** — especially for log-derived attribution (`explicit`, `correlated`, `heuristic`, `unknown`).
- **Redaction before disk preserved** — same safety pipeline as today (`prepareTraceEventForDisk`, `Redactor`).
- **Event size bounds preserved** — per-line byte caps and metadata truncation.
- **No timestamp-only fake nesting** — parent relationships require explicit `parentId` (or adapter-equivalent IDs), not sort order alone.
- **`list` / `view` / `export` / `diff` continue working** — via dual-read or conversion layer during transition.
- **Future timeline / stats** consume the same model without a second normalization pass.

---

## 3. Non-goals

- No **v2 breaking schema** or removal of `0.1` support in this initiative.
- No **vendor upload**, **OTLP HTTP sink**, or **hosted storage**.
- No **SaaS / dashboard** product scope.
- No **replay / cassette** execution engine.
- No **cost engine** or billing-grade token accounting in core.
- No **raw chain-of-thought** or full prompt capture by default.
- No **universal monkey-patching** or ambient auto-instrumentation.
- **This PR does not implement** the model — documentation and test planning only.

---

## 4. Proposed model

> **Proposal only.** Do not add this type to `packages/core/src` until PR 2.

```ts
type PersistedInspectEvent = {
  schemaVersion: "0.2";
  eventId: string;
  runId: string;
  parentId?: string;
  kind: InspectKind;
  name: string;
  status?: "running" | "ok" | "error" | "unknown";
  timestamp: string; // ISO-8601 — canonical persisted form
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  confidence: AttributionConfidence;
  source: {
    type: "manual" | "json-log" | "log4js" | "adapter" | "ai-sdk" | "otel";
    name?: string;    // e.g. "langchain", "vercel-ai-sdk"
    version?: string; // adapter or ingest package version when known
  };
  attributes?: Record<string, unknown>;
  inputSummary?: unknown;
  outputSummary?: unknown;
  error?: {
    name?: string;
    message: string;
    code?: string;
  };
  tokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  };
  trace?: {
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
  };
};
```

### 4.1 Relationship to existing types

| Existing | Role today | Relationship to proposal |
| -------- | ---------- | ------------------------ |
| `TraceEvent` (`0.1`) | Persisted manual JSONL | **Legacy input** — converted to `PersistedInspectEvent` at read or lazily at write-boundary (future PRs) |
| `InspectEvent` | In-memory log/adapter model | **Closest current shape** — proposal adds `schemaVersion`, ISO timestamps, richer `source`, optional `trace` block |
| `InspectRunTree` | Tree view for export/diff/logs | **Unchanged consumer** — built from `PersistedInspectEvent[]` via source-agnostic tree builder |

### 4.2 `InspectKind` (unchanged set)

Reuse existing `InspectKind`: `RUN`, `AGENT`, `LLM`, `TOOL`, `CHAIN`, `RETRIEVER`, `DECISION`, `RESULT`, `ERROR`, `LOGIC`, `LOG`.

### 4.3 Status vocabulary

| Layer | Values | Notes |
| ----- | ------ | ----- |
| Manual `0.1` | `success` / `error` on completed events | Mapped to `ok` / `error` |
| In-memory `InspectEvent` | `running` / `ok` / `error` | Preserved |
| Proposal | adds `unknown` | For incomplete or ambiguous rows — **not** treated as success |

### 4.4 Timestamp policy

- **Persisted `0.2`:** ISO-8601 strings (`timestamp`, optional `startedAt` / `endedAt`).
- **In-memory / `0.1`:** remain numeric ms during transition; converters handle both directions for tests.
- **No nesting by timestamp sort alone** — `TreeBuilder` only attaches children when `parentId` resolves to a known `eventId`.

---

## 5. Legacy compatibility (`schemaVersion: "0.1"`)

### 5.1 Manual event mapping

Manual traces emit **pairs** of lifecycle rows. The proposal collapses each logical node to **one** `PersistedInspectEvent` where possible (future write path) or **synthetic rows** at read time (transition).

| `0.1` event | Maps to `PersistedInspectEvent` |
| ----------- | -------------------------------- |
| `run_started` | `kind: RUN`, `status: running`, `name` from run, `startedAt` from `startTime`, `confidence: explicit`, `source.type: manual` |
| `run_completed` | Same `eventId` as run node **or** separate RUN row with `status: ok/error` — **open question** (see §10) |
| `step_started` | `kind` from `type` (see §6.1), `status: running`, `parentId`, `startedAt` from `startTime`, metadata → `attributes` |
| `step_completed` | Merge into matching step: `status: ok` if `success`, `error` if `error`, `durationMs`, `error` block |

**Important invariants (unchanged):**

- There is **no `step_failed` event** — failures are `step_completed` with `status: "error"`.
- Old traces **remain readable** — `readTraceEvents` and `isTraceEvent` validation stay for `0.1`.
- Old traces are **not rewritten** automatically on disk.

### 5.2 Dual-read strategy (recommended)

During v1.2.x:

1. Detect format per line (`schemaVersion` field).
2. `0.1` lines → `convertTraceEventToPersisted()` (pure function, PR 2).
3. `0.2` lines → validate as `PersistedInspectEvent`.
4. Feed unified array to **one** tree builder.

`list` metadata extraction may continue fast-path scanning `0.1` until a `0.2` metadata scanner exists (PR 4).

---

## 6. Source mappings

### 6.1 Manual `TraceEvent`

| Field | Mapping |
| ----- | ------- |
| **source.type** | `manual` |
| **kind** | `run` → `CHAIN` or `RUN`; `llm` → `LLM`; `tool` → `TOOL`; `decision` → `DECISION`; `logic`/`state`/`custom` → `LOGIC` (same as `manualTraceEventsToRunTree`) |
| **parent** | `parentId` on `step_started` → `parentId` |
| **confidence** | always `explicit` |
| **redaction** | `metadata` redacted via `prepareTraceEventForDisk` before persistence today → `attributes` on write |
| **limitations** | No per-step `inputSummary`/`outputSummary` in MVP manual API; paired start/complete rows |

### 6.2 JSON logs

| Field | Mapping |
| ----- | ------- |
| **source.type** | `json-log` |
| **kind** | Config mapping + `inferKind()` heuristics on event name |
| **parent** | Explicit `parentId` keys from `LogIngestConfig`; else flat root |
| **confidence** | `explicit` if parentId present; `correlated` if grouped by runId only; `heuristic`/`unknown` per normalizer rules |
| **redaction** | `Redactor` on attributes at normalize time |
| **limitations** | Not persisted today; ingest config required; no automatic persistence in v1.2 PR 1 |

### 6.3 log4js logs

| Field | Mapping |
| ----- | ------- |
| **source.type** | `log4js` |
| **kind** | Same as JSON after embedded JSON extraction |
| **parent** | Same as JSON logs |
| **confidence** | Often `correlated` or `heuristic` — embedded JSON may lack parent keys |
| **redaction** | Same as JSON logs |
| **limitations** | Best-effort parsing; non-JSON layouts may drop fields |

### 6.4 LangChain callbacks

| Field | Mapping |
| ----- | ------- |
| **source.type** | `adapter` |
| **source.name** | `langchain` |
| **kind** | Handler-specific: LLM, TOOL, CHAIN, RETRIEVER, AGENT, etc. |
| **parent** | LangChain `parentRunId` → `parentId` (via `lcToStepId` map when persisting to `0.1` today) |
| **confidence** | `explicit` for adapter-emitted events |
| **redaction** | `Redactor` + `capture: metadata-only` default; previews truncated |
| **limitations** | Streaming not yet designed ([#14](https://github.com/rajudandigam/agent-inspect/issues/14)); persistence currently re-encodes to `0.1` |

### 6.5 Future Vercel AI SDK telemetry

| Field | Mapping |
| ----- | ------- |
| **source.type** | `ai-sdk` |
| **source.name** | `vercel-ai-sdk` |
| **kind** | `LLM` / `TOOL` / `AGENT` from SDK hook surface |
| **parent** | SDK span parent when exposed; else flat |
| **confidence** | `explicit` when SDK provides parent span id |
| **redaction** | Metadata-only default; no vendor upload |
| **limitations** | Design note only ([#30](https://github.com/rajudandigam/agent-inspect/issues/30)); not implemented |

### 6.6 Future OTel / OpenInference export (read path)

| Field | Mapping |
| ----- | ------- |
| **source.type** | `otel` when imported from external spans (future) |
| **kind** | Map OTel `span.kind` + GenAI attributes → `InspectKind` |
| **parent** | `trace.parentSpanId` → `parentId` |
| **confidence** | `explicit` when span parent present |
| **redaction** | Import-time redaction required; export remains local file |
| **limitations** | **No full OTel compliance claim**; import is exploratory Future scope |

---

## 7. Standards alignment

AgentInspect stores **its own stable local fields** first. Export adapters map outward at **export time** (existing pattern in `openinference-exporter.ts`, `otlp-json-exporter.ts`).

### 7.1 OpenInference (compatibility-oriented)

| `InspectKind` | OpenInference span kind (current exporter) |
| ------------- | ------------------------------------------ |
| `LLM` | `LLM` |
| `TOOL` | `TOOL` |
| `CHAIN` | `CHAIN` |
| `RETRIEVER` | `RETRIEVER` |
| `AGENT` | `AGENT` |
| `DECISION`, `RESULT`, `ERROR`, `LOG`, `LOGIC`, `RUN` | Mapped with **warnings** to `CHAIN` or `UNKNOWN` |

Language: **OpenInference-compatible** export — not vendor certification.

### 7.2 OTel GenAI (aligned, experimental)

- Map `tokenUsage` → GenAI attribute names when exporting OTLP JSON (e.g. `gen_ai.usage.input_tokens`).
- Map `kind: LLM` → `gen_ai.operation.name` where applicable.
- **OpenTelemetry GenAI semantic conventions are still development-stage** — do not lock core schema to draft attribute names; keep `attributes` bag for forward compatibility.

Language: **OTel GenAI-aligned** — experimental until verified against target collectors.

### 7.3 Principles

- No default network export.
- Warnings array on export when kinds are ambiguous.
- `trace.traceId` / `spanId` optional on persisted events for round-trip with export formats.

---

## 8. Migration plan (future PRs)

### PR 2 — Core types and converters (no CLI migration)

- Add `PersistedInspectEvent` types (likely `packages/core/src/types/persisted-inspect-event.ts`).
- Pure converters:
  - `traceEventToPersisted(event: TraceEvent): PersistedInspectEvent | PersistedInspectEvent[]`
  - `inspectEventToPersisted(event: InspectEvent): PersistedInspectEvent`
  - `persistedToInspectEvent(event: PersistedInspectEvent): InspectEvent` (for tree builder reuse)
- Unit tests only; **no change** to `writeTraceEvent` or CLI.

### PR 3 — In-memory tree bridge (completed)

- `persistedInspectEventsToRunTrees` and `traceEventsToPersistedRunTrees` build `InspectRunTree[]` via existing `TreeBuilder`.
- Pure in-memory helpers only — **no** storage or CLI changes in this chunk.

### PR 4 — Storage read/write path (future)

- Optional write of `0.2` lines (feature-flagged or opt-in `persistFormat: "0.2"` on `inspectRun`).
- `readPersistedEvents()` — dual-read `0.1` + `0.2`.
- CLI integration remains a later step.

### PR 5 — CLI integration

- `list` / `view` / `export` / `diff` consume unified read path.
- Fixtures: add `fixtures/traces-v0.2/` samples; keep all `fixtures/traces/*.jsonl` (`0.1`) valid.
- Update `docs/SCHEMA.md` with `0.2` section (additive).

### PR 6 — Docs / fixtures cleanup (if needed)

- LangChain `persist` emits `0.2` natively (stop re-encoding to manual step pairs).
- Migration guide for authors who want to **opt in** to `0.2` writes.

---

## 9. Test plan (to add in PR 2+)

| Test | PR |
| ---- | -- |
| All `fixtures/traces/*.jsonl` (`0.1`) still readable via `readTraceEvents` | 2+ |
| `traceEventToPersisted` round-trip preserves run/step tree shape | 2 |
| Manual `0.1` → persisted → `InspectRunTree` matches `manualTraceEventsToRunTree` | 2 |
| Log-derived `InspectEvent` → `persistedInspectEvent` preserves kind, confidence, parentId | 2 |
| LangChain fixture trace → persisted conversion preserves adapter `source` | 2 |
| `source.type` preserved per mapping table | 2 |
| `confidence` preserved (`explicit` / `correlated` / `heuristic` / `unknown`) | 2 |
| Explicit `parentId` nesting only — no child created from timestamp order alone | 2 |
| Redaction: sensitive keys stripped in `attributes` before persist | 3 |
| Size bounds: oversized `attributes` truncated; line ≤ `maxEventBytes` | 3 |
| `export` / `diff` consume source-agnostic tree (golden snapshots) | 4 |
| `list` metadata works for `0.1` and `0.2` files | 4 |
| Conformance: `packages/core/test/conformance/event-model.conformance.test.ts` extended | 4 |
| Fixture validation: `pnpm fixtures:check` includes optional `0.2` traces | 5 |

---

## 10. Risks and open questions

| Question | Options | Maintainer decision needed |
| -------- | ------- | -------------------------- |
| **`0.2` vs separate `format` field** | Use `schemaVersion: "0.2"` on each line (recommended — matches `0.1` pattern) vs top-level file header | Prefer `schemaVersion` per line |
| **File location** | Same `traceDir` mixed `0.1`/`0.2` lines vs subdirectory `.agent-inspect-runs/v2/` vs separate extension `.inspect.jsonl` | Mixed lines in one file complicates readers; separate files per run recommended |
| **Run lifecycle: one or two RUN rows** | Single RUN row updated in place (not append-friendly) vs `run_started`/`run_completed` pair as two `0.2` rows vs one RUN + status merge on read | Favor **one logical RUN node** with final status merged at read or coalesced at write |
| **Auto-detect in CLI** | `view`/`export`/`diff` auto-detect per line vs require flag | Auto-detect per line (recommended) |
| **Duplicate run metadata** | Run-level `attributes` on RUN row only vs repeated on every event | RUN row + optional denormalized cache in file footer (future) |
| **Package API surface** | Export converters only vs public `PersistedInspectEvent` type | Keep **small** — types + read helpers; converters mostly internal until stabilized |
| **Premature v2 lock-in** | Stay on `0.2` persisted through v1.x; reserve **v2 product** for breaking API/CLI promises | Do not conflate persisted `0.2` with npm major v2 |

---

## Related documents

- [SCHEMA.md](../SCHEMA.md) — canonical `0.1` reference today
- [ARCHITECTURE.md](../ARCHITECTURE.md) — package layout
- [ADAPTERS.md](../ADAPTERS.md) — LangChain behavior
- [EXPORTS.md](../EXPORTS.md) — export compatibility wording
- [UNIFIED-PERSISTED-INSPECT-EVENT-CHECKLIST.md](./UNIFIED-PERSISTED-INSPECT-EVENT-CHECKLIST.md) — implementation checklist

**Maintainer-owned:** schema evolution, converters, storage path, and CLI integration require explicit ack per [CONTRIBUTOR-ROLES.md](../community/CONTRIBUTOR-ROLES.md).
