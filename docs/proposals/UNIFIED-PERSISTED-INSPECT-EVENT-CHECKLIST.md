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

## PR 2 — Core types and validator

- [ ] Add `packages/core/src/types/persisted-inspect-event.ts`
- [ ] Define `PersistedInspectEvent`, `PersistedEventSource`, status/kind helper types
- [ ] Implement `isPersistedInspectEvent(value: unknown): value is PersistedInspectEvent`
- [ ] Export types and validator from `packages/core/src/index.ts`
- [ ] **No** storage write path, converters, or CLI changes

**Expected tests:**

- [ ] `packages/core/test/types/persisted-inspect-event.test.ts` — valid minimal event passes
- [ ] Rejects missing `schemaVersion`, wrong version, missing `eventId`/`runId`/`kind`/`timestamp`/`confidence`/`source`
- [ ] Accepts optional `parentId`, `attributes`, `tokenUsage`, `trace` block
- [ ] `source.type` union accepts `manual`, `json-log`, `log4js`, `adapter`, `ai-sdk`, `otel`
- [ ] `packages/core/test/api-stability.test.ts` updated if export surface changes

**Prompt stub:** [v1.2.0-pr2-persisted-event-types.md](../implementation/prompts/v1.2.0-pr2-persisted-event-types.md)

---

## PR 3 — Legacy `0.1` TraceEvent converters

- [ ] Implement `traceEventToPersisted()` (per-event and/or batch coalescing per proposal §5)
- [ ] Implement `persistedToInspectEvent()` for tree-builder interop
- [ ] Pure functions only — **no** `writeTraceEvent` changes

**Expected tests:**

- [ ] Maps `run_started` / `run_completed` / `step_started` / `step_completed` correctly
- [ ] No `step_failed` assumption — errors from `step_completed` + `status: "error"`
- [ ] All `fixtures/traces/*.jsonl` convert without throw
- [ ] Converted tree matches `manualTraceEventsToRunTree` for fixture set
- [ ] `parentId` explicit nesting only — no timestamp-only nesting
- [ ] `source.type: manual`, `confidence: explicit`

---

## PR 4 — Log-derived InspectEvent converters

- [ ] Implement `inspectEventToPersisted(event: InspectEvent): PersistedInspectEvent`
- [ ] Preserve `confidence` and log `source.type` (`json-log`, `log4js`, etc.)
- [ ] Map numeric timestamps → ISO strings in persisted form

**Expected tests:**

- [ ] JSON log fixture events convert with `confidence` preserved
- [ ] log4js-derived events map `source.type: log4js`
- [ ] `parentId` preserved when present; flat when absent
- [ ] Redaction-ready `attributes` shape (no new redaction logic required in PR 4)

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
