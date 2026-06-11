# Unified persisted InspectEvent — implementation checklist

Tracks v1.2.0 release-train chunks for [UNIFIED-PERSISTED-INSPECT-EVENT.md](./UNIFIED-PERSISTED-INSPECT-EVENT.md).

**Execution guide:** [docs/implementation/CURSOR-MAINTAINER-ROADMAP.md](../implementation/CURSOR-MAINTAINER-ROADMAP.md)  
**Publish policy:** Merge chunks to `main`; publish **one** npm release when the full train passes release gates — not per chunk.

---

## PR 1 — Design proposal (completed)

- [x] Create `docs/proposals/UNIFIED-PERSISTED-INSPECT-EVENT.md`
- [x] Create this checklist
- [x] Link from `docs/ARCHITECTURE.md` and `ROADMAP.md`
- [x] No runtime or `schemaVersion: "0.1"` write-path changes

**Expected validation (docs-only):**

- [x] `pnpm typecheck`
- [x] `pnpm test`

---

## PR 2A — Core types and validator (completed)

- [x] Add `packages/core/src/types/persisted-inspect-event.ts`
- [x] Define `PersistedInspectEvent`, `PersistedEventSource`, status/kind helper types
- [x] Implement `isPersistedInspectEvent(value: unknown): value is PersistedInspectEvent`
- [x] Export types and validator from `packages/core/src/index.ts`
- [x] **No** storage write path, converters, or CLI changes

**Expected tests:**

- [x] `packages/core/test/types/persisted-inspect-event.test.ts` — valid minimal event passes
- [x] Rejects missing `schemaVersion`, wrong version, missing `eventId`/`runId`/`kind`/`timestamp`/`confidence`/`source`
- [x] Accepts optional `parentId`, `attributes`, `tokenUsage`, `trace` block
- [x] `source.type` union accepts `manual`, `json-log`, `log4js`, `adapter`, `ai-sdk`, `otel`
- [x] `packages/core/test/api-stability.test.ts` updated if export surface changes

## PR 2B — Legacy `0.1` TraceEvent converters (completed)

- [x] Add `packages/core/src/persisted/from-trace-event.ts`
- [x] Implement `traceEventToPersistedInspectEvent` / `traceEventsToPersistedInspectEvents`
- [x] Deterministic `eventId`, ISO timestamps, manual `source`, explicit `confidence`
- [x] Export from `packages/core/src/index.ts`
- [x] **No** storage write path or CLI changes

**Expected tests:**

- [x] `packages/core/test/persisted/from-trace-event.test.ts` — all four event kinds
- [x] `run_completed` / `step_completed` error + stack mapping
- [x] StepType → InspectKind mapping
- [x] Batch conversion + invalid timestamp fallback + input immutability
- [x] `api-stability.test.ts` converter exports

## PR 2C/2D — InspectEvent ↔ PersistedInspectEvent bridge (completed)

- [x] `PersistedInspectEvent` types and `isPersistedInspectEvent` (PR 2A)
- [x] `traceEventToPersistedInspectEvent` / `traceEventsToPersistedInspectEvents` (PR 2B)
- [x] Add `packages/core/src/persisted/from-inspect-event.ts`
- [x] Implement `inspectEventToPersistedInspectEvent` / `inspectEventsToPersistedInspectEvents`
- [x] Add `packages/core/src/persisted/to-inspect-event.ts`
- [x] Implement `persistedInspectEventToInspectEvent` / `persistedInspectEventsToInspectEvents`
- [x] Export all persisted types, validators, and converters from `packages/core/src/index.ts`
- [x] **No** storage read/write, CLI, or `schemaVersion: "0.2"` file persistence changes

**Expected tests:**

- [x] `packages/core/test/persisted/from-inspect-event.test.ts` — source mapping, tokens, errors, previews, timestamps
- [x] `packages/core/test/persisted/to-inspect-event.test.ts` — reverse mapping, `skipInvalid`, invalid input throws
- [x] `packages/core/test/api-stability.test.ts` — all converter exports and option type witnesses

---

## PR 3 — Source-agnostic tree builder (next)

- [ ] Implement `buildRunTreeFromPersisted()` (or equivalent) for `PersistedInspectEvent[]`
- [ ] Pure functions only — **no** CLI read-path changes yet
- [ ] **No** `writeTraceEvent` / `readTraceEvents` changes

---

## PR 5 — LangChain adapter converters

- [ ] Implement adapter-path `inspectEventToPersisted` variants or shared helper with `source.name: langchain`
- [ ] Map in-memory LangChain callback events to persisted shape
- [ ] **No** change to `LangChainTracePersistence` write path yet

**Expected tests:**

- [ ] LangChain callback sample events convert with `source.type: adapter`
- [ ] Kinds LLM / TOOL / CHAIN preserved
- [ ] Metadata-only capture defaults reflected in `attributes` shape

---

## PR 6 — Source-agnostic tree builder bridge

- [ ] Implement `buildRunTreeFromPersisted(events: PersistedInspectEvent[]): InspectRunTree`
- [ ] Reuse or wrap existing `TreeBuilder` via `persistedToInspectEvent`
- [ ] Explicit `parentId` nesting only

**Expected tests:**

- [ ] Manual `0.1` fixture → convert → tree matches `manualTraceEventsToRunTree`
- [ ] Log-derived persisted events build flat/correlated trees per confidence rules
- [ ] `packages/core/test/conformance/tree-builder.conformance.test.ts` extended

---

## PR 7 — CLI read-path integration (if approved)

- [ ] Dual-read: detect `0.1` vs `0.2` per JSONL line
- [ ] `view` / `export` / `diff` consume unified tree path (fallback to legacy OK during transition)
- [ ] `list` metadata scanner for `0.2` files (keep `0.1` fast path)
- [ ] **No** default write of `0.2` unless explicitly approved in same or prior chunk

**Expected tests:**

- [ ] `packages/cli/test/view.test.ts` — dual format cases
- [ ] CLI `view` golden output for `0.1` fixtures unchanged
- [ ] `packages/core/test/conformance/exporters.conformance.test.ts` on `0.2` fixtures
- [ ] `schema-compatibility.test.ts` extended for `0.2`

---

## PR 8 — Docs, fixtures, changelog (train completion)

- [ ] Add `fixtures/traces-v0.2/` canonical samples
- [ ] Update `docs/SCHEMA.md` with additive `0.2` section
- [ ] Update `CHANGELOG.md` with v1.2.0 section (maintainer adds changeset separately)
- [ ] Update `ROADMAP.md` Released recently when published
- [ ] `pnpm fixtures:check` validates new fixtures

**Expected tests:**

- [ ] All existing `fixtures/traces/*.jsonl` still pass validation
- [ ] New `0.2` fixtures pass validation
- [ ] Full release-train readiness validation (see execution guide §8)

---

## Validation gates (every implementation chunk)

```bash
pnpm build          # runtime chunks
pnpm typecheck
pnpm test
pnpm fixtures:check   # when fixtures change
pnpm recipes:check    # if recipes touched
pnpm compat:smoke     # if package exports or bundle layout change
```

---

## Out of scope (all v1.2.0 chunks)

- LangChain streaming ([#14](https://github.com/rajudandigam/agent-inspect/issues/14))
- Timeline / stats / cohort CLI
- CI reporters ([#24](https://github.com/rajudandigam/agent-inspect/issues/24))
- OTLP HTTP sink / vendor upload
- npm major v2 API break
- Automatic rewrite of existing `0.1` trace files
