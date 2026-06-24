# Trace vocabulary — v1.5.0 RFC

**Status:** Accepted for v1.5.0 train (Chunk 3) — design only; no write-path or validator changes in this chunk  
**Audience:** Maintainers, adapter authors, CLI/report implementers  
**Baseline:** `agent-inspect@1.4.0` + v1.5.0 Chunks 1–2  
**Related:** [UNIFIED-PERSISTED-INSPECT-EVENT.md](./UNIFIED-PERSISTED-INSPECT-EVENT.md) · [SCHEMA.md](../SCHEMA.md) · [API-BOUNDARY-V1.5.md](../implementation/API-BOUNDARY-V1.5.md)

This RFC freezes the **canonical vocabulary** for inspection, `what`/`report`, and dual-format read (Chunks 4–8). It does **not** change manual trace writing (`schemaVersion: "0.1"`) or ship new runtime types in Chunk 3.

---

## 1. Problem

AgentInspect uses **three related vocabularies** today:

| Layer | Schema | Kind / type field | Token fields |
|-------|--------|-------------------|--------------|
| Manual JSONL | `0.1` `TraceEvent` | `StepType` on `step_started` | `metadata.tokens` on `step_started` |
| Persisted unified | `0.2` `PersistedInspectEvent` | `InspectKind` | `tokenUsage` on event |
| Log-derived (memory) | none on disk | `InspectKind` | `attributes.tokens` |

Without a single RFC, `what`/`report`, stats, and dual-read risk inconsistent labels, missed token display, and accidental scope creep (cost engine, OTel fields, cache-token breakdown).

---

## 2. Goals (v1.5.0)

- **One canonical kind enum** for inspection output: `InspectKind` (already in core).
- **Explicit `StepType` → `InspectKind` mapping** for v0.1 read/conversion (documented, not changed in types).
- **Token metadata shape** on v0.2 `PersistedInspectEvent` — **affirm existing** `PersistedTokenUsage`; document v0.1 bridge.
- **Streaming LLM metadata** in `attributes` (not new top-level fields) — aligns with `@agent-inspect/langchain` `stream: true`.
- **Fixture samples** for token + streaming on v0.2 JSONL.
- **Explicit deferral list** for v2.0 and v1.9.0 standards work.

## 3. Non-goals (v1.5.0)

- No breaking schema changes; no new required fields on `0.1` or `0.2`.
- No CLI write path switch to v0.2.
- No cost / pricing fields, no token **counting** in core, no billing semantics.
- No OpenInference / OTLP field alignment (v1.9.0).
- No `cache_tokens`, `reasoning_tokens`, or provider-specific token breakdown (defer §8).
- No automatic migration of on-disk v0.1 files.

---

## 4. Canonical kind vocabulary (`InspectKind`)

**Source of truth:** `packages/core/src/types/inspect-event.ts`

| `InspectKind` | Meaning | Typical sources |
|---------------|---------|-----------------|
| `RUN` | Root workflow / job | `run_started`, log job root |
| `AGENT` | Agent loop or orchestrator | Adapters, multi-agent recipes |
| `LLM` | Model inference call | `step.llm`, log `llm:*`, adapters |
| `TOOL` | Tool / function execution | `step.tool`, log `tool:*` |
| `CHAIN` | Framework chain / composite | LangChain chain, pipeline segment |
| `RETRIEVER` | Retrieval / search index | RAG recipes, log mapping |
| `DECISION` | Branching / routing choice | `step` type `decision`, eval metadata |
| `RESULT` | Terminal outcome / notification | Log `result:*` patterns |
| `ERROR` | Explicit error node (when modeled separately) | Rare; usually `status: "error"` on parent kind |
| `LOGIC` | Generic logic / planning step | `step` type `logic`, default manual steps |
| `LOG` | Unclassified log line | Log ingest fallback |

**v1.5 rule:** CLI `what`/`report` and renderers use **`InspectKind` labels** after normalization. Do not invent parallel kind strings per command.

### 4.1 `StepType` → `InspectKind` (v0.1 manual traces)

Used by `traceEventToPersistedInspectEvent` and inspection helpers. **Frozen for v1.5:**

| `StepType` (v0.1) | `InspectKind` (normalized) |
|-------------------|----------------------------|
| `run` | `RUN` |
| `llm` | `LLM` |
| `tool` | `TOOL` |
| `decision` | `DECISION` |
| `logic` | `LOGIC` |
| `state` | `LOGIC` |
| `custom` | `LOGIC` |

`run_started` / `run_completed` map to `RUN` rows in v0.2 conversion (see existing converter). No new `StepType` values in v1.5.

---

## 5. Status vocabulary

### 5.1 Manual v0.1 (`TraceEvent`)

| Location | Values | Notes |
|----------|--------|-------|
| `run_completed.status` | `success` \| `error` | No `running` on completed event |
| `step_completed.status` | `success` \| `error` | Failures are **not** a separate event name |

### 5.2 Persisted v0.2 (`PersistedInspectEvent`)

| Field | Values | Notes |
|-------|--------|-------|
| `status` | `running` \| `ok` \| `error` \| `unknown` | Optional; `unknown` = safe default when uncertain |

**Mapping v0.1 → v0.2:** `success` → `ok`, `error` → `error` (implemented in `from-trace-event.ts`).

### 5.3 Inspection display (v1.5)

- Human output may show `ok` / `error` / `running` for unified views.
- **Never** treat `unknown` as success (per [SCHEMA.md](../SCHEMA.md)).

---

## 6. Token metadata — v1.5 decision

### 6.1 Principles

1. **Counts only** — optional non-negative integers; no floats, no currency.
2. **LLM-primary** — `tokenUsage` is most meaningful on `kind: "LLM"`; other kinds may omit it.
3. **User-supplied** — core does not call provider APIs to count tokens (MVP guardrail).
4. **Redaction** — token counts are not secrets but may appear in exports; subject to existing redaction/size bounds when embedded in `attributes`.

### 6.2 v0.1 manual traces

On `step_started.metadata`:

```ts
interface TokenMetadata {
  input?: number;   // prompt / input tokens
  output?: number;  // completion / output tokens
}
```

- Stored under `metadata.tokens` (see [SCHEMA.md](../SCHEMA.md)).
- Example fixture: `fixtures/traces/llm-with-tokens.jsonl`.
- **v1.5:** No change to v0.1 write shape. Document only.

### 6.3 v0.2 persisted events

On `PersistedInspectEvent`:

```ts
interface PersistedTokenUsage {
  input?: number;
  output?: number;
  total?: number;   // MAY be input + output when both present; not required
}
```

- **Top-level field:** `tokenUsage` (not nested in `attributes`).
- Validator: `isPersistedInspectEvent` — non-negative numbers only (already shipped v1.2.0).
- Converters: `metadata.tokens` ↔ `tokenUsage` (already in `from-trace-event.ts`, `from-inspect-event.ts`, `to-inspect-event.ts` mirrors `attributes.tokens`).

**v1.5 decision:** **Keep this shape unchanged.** No new token subfields in v1.5.

### 6.4 Streaming metadata (LLM)

LangChain adapter (`stream: true`) records **streaming lifecycle** in step metadata, not full token text. For v0.2 persisted rows, map to **`attributes`** on `LLM` events:

| Attribute key | Type | When |
|---------------|------|------|
| `model` | string | Model id when known |
| `stream` | boolean | `true` when streaming mode enabled |
| `chunkCount` | number | Chunks observed (bounded) |
| `streamDurationMs` | number | Wall time for stream |
| `streamPreview` | string | Optional truncated preview (redacted, bounded) |

**v1.5 decision:** Streaming fields stay in **`attributes`** — not in `tokenUsage`, not new top-level fields. `what`/`report` may summarize them when present.

### 6.5 Correlation metadata (v1.3.0)

On v0.1 `run_started.metadata`: `correlationId`, `requestId`, `decisionId`, `groupId`.

**v1.5 dual-read:** When converting to v0.2 for inspection, copy into `RUN` event `attributes` with the same keys (Chunk 7–8 implementation). No new correlation field names in v1.5.

---

## 7. Model, tool, and provider attributes

| Concept | v0.1 location | v0.2 location |
|---------|---------------|---------------|
| Model id | `step_started.metadata.model` | `attributes.model` on `LLM` |
| Tool name | `step_started.metadata.toolName` | `attributes.toolName` on `TOOL` |
| Adapter identity | N/A (manual) | `source.name`, `source.version` |
| Capture mode | N/A | `attributes.capture` (`metadata-only`, etc.) |

**v1.5:** Prefer `source` for provenance, `attributes` for per-event technical metadata.

---

## 8. Deferred to later trains

| Topic | Target | Rationale |
|-------|--------|-----------|
| `cache_tokens`, `reasoning_tokens`, provider breakdown | v2.0 or v1.9.0 | Standards alignment first; avoid partial vendor shapes |
| Cost / USD fields | **Never in core** (product boundary) | Not an observability billing engine |
| OTel `trace` block population | v1.9.0 | `PersistedTraceContext` exists; fill via standards hardening |
| New `InspectKind` values | v2.0 only | Breaking for exporters and fixtures |
| Default write format v0.2 | v2.0.0 | Migration guide required |
| `step_failed` event | **Rejected** | Failures remain `step_completed` + `error` |
| Token counting in core | **Rejected** | User/adapter supplies counts |

---

## 9. v1.5 implementation map (Chunks 4–8)

| Chunk | Vocabulary use |
|-------|----------------|
| **4 `what`** | Summarize by `InspectKind`; show `tokenUsage` on LLM rows when present |
| **5 `report`** | Markdown/HTML tables use kind + status labels from this RFC |
| **6 recipes** | Document how to set `metadata.tokens` (v0.1) for CI artifacts |
| **7–8 dual-read** | Normalize v0.1 + v0.2 to `PersistedInspectEvent` or shared view using mappings §4–6 |

---

## 10. Fixture plan (v0.2)

New canonical sample: **`fixtures/traces-v0.2/llm-tokens-and-streaming.jsonl`**

| Line | Demonstrates |
|------|----------------|
| `RUN` | Manual source, explicit confidence |
| `LLM` + `tokenUsage` | Full input/output/total (mirrors `llm-with-tokens.jsonl` v0.1 intent) |
| `LLM` + streaming `attributes` | `stream`, `chunkCount`, `streamDurationMs` without `tokenUsage` |

Existing fixtures remain valid:

- `manual-basic.jsonl` — includes minimal `tokenUsage` on one LLM row
- `adapter-langchain-like.jsonl` — adapter `attributes` without tokens

Validation: `pnpm fixtures:check` after `pnpm build`.

---

## 11. Acceptance criteria (Chunk 3)

- [x] RFC published (this document)
- [x] v1.5 vs deferral table explicit (§8)
- [x] Token shape affirmed — no type changes required
- [x] v0.2 fixture added for token + streaming samples
- [ ] Chunk 7–8: converters copy correlation into RUN `attributes` (implementation)
- [ ] Chunk 4–5: `what`/`report` reference this RFC in docs

---

## 12. References

- Types: `packages/core/src/types/inspect-event.ts`, `types/persisted-inspect-event.ts`, `types.ts`
- Converters: `packages/core/src/persisted/from-trace-event.ts`
- LangChain streaming: `@agent-inspect/langchain` callback options
- Execution: [V1.5.0-EXECUTION-PLAN.md](../implementation/release-trains/V1.5.0-EXECUTION-PLAN.md)
