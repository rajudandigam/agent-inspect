# Unified persisted InspectEvent — implementation checklist

Tracks future PRs for [UNIFIED-PERSISTED-INSPECT-EVENT.md](./UNIFIED-PERSISTED-INSPECT-EVENT.md).

**PR 1 (this initiative):** design doc only — no runtime changes.

---

## PR 2 — Core types and converters

- [ ] Add `PersistedInspectEvent` types (proposal shape, `schemaVersion: "0.2"`)
- [ ] Add `AttributionConfidence` / `InspectKind` re-exports or shared module if needed
- [ ] Implement `traceEventToPersisted()` for each `0.1` event kind
- [ ] Implement `inspectEventToPersisted()` for log/adapter in-memory events
- [ ] Implement `persistedToInspectEvent()` for tree-builder interop
- [ ] **No** changes to `writeTraceEvent`, `inspectRun`, or CLI

**Expected tests:**

- [ ] `traceEventToPersisted` maps `run_started` / `run_completed` / `step_*` correctly
- [ ] No `step_failed` assumption — errors from `step_completed` + `status: error`
- [ ] All `fixtures/traces/*.jsonl` convert without throw
- [ ] Converted tree matches `manualTraceEventsToRunTree` for fixture set
- [ ] Log fixture events convert with `confidence` preserved
- [ ] LangChain sample events convert with `source.type: adapter`
- [ ] `parentId` explicit nesting only in converter output
- [ ] `source.type` preserved per mapping table

---

## PR 3 — Storage read/write path

- [ ] Add `readPersistedEvents(runId, traceDir)` with dual `0.1` / `0.2` line detection
- [ ] Add opt-in write path for `0.2` (e.g. `InspectRunOptions.persistFormat` — name TBD)
- [ ] Implement `buildRunTreeFromPersisted(events: PersistedInspectEvent[])`
- [ ] Wire `prepareTraceEventForDisk` equivalent for `0.2` attributes
- [ ] Preserve `maxEventBytes` and redaction defaults on `0.2` writes
- [ ] **No** automatic rewrite of existing `0.1` files

**Expected tests:**

- [ ] Dual-read: file with only `0.1` lines behaves as today
- [ ] Dual-read: file with only `0.2` lines builds tree
- [ ] Dual-read: mixed file rejected or handled per maintainer decision
- [ ] Redaction applied before `0.2` disk write
- [ ] Oversized event truncated per `maxEventBytes`
- [ ] `readTraceEvents` unchanged for `0.1` consumers (API stability)

---

## PR 4 — CLI integration

- [ ] `view` uses unified read + tree builder (fallback to legacy path OK during transition)
- [ ] `export` uses unified tree for Markdown / HTML / OpenInference / OTLP JSON
- [ ] `diff` uses unified comparable run model
- [ ] `list` extracts metadata from `0.2` files (keep `0.1` fast path)
- [ ] Add `fixtures/traces-v0.2/` canonical samples
- [ ] Update `docs/SCHEMA.md` with additive `0.2` section
- [ ] `pnpm fixtures:check` validates new fixtures if added

**Expected tests:**

- [ ] CLI `view` golden output for `0.1` fixtures unchanged
- [ ] CLI `export` / `diff` conformance tests pass on `0.2` fixtures
- [ ] `packages/cli/test/view.test.ts` — dual format cases
- [ ] `packages/core/test/conformance/exporters.conformance.test.ts` extended
- [ ] `schema-compatibility.test.ts` extended for `0.2`

---

## PR 5 — Docs / fixtures / adapter cleanup (if needed)

- [ ] LangChain `persist: true` writes native `0.2` (stop re-encoding to manual step pairs)
- [ ] ADAPTERS.md documents `0.2` persistence option
- [ ] Optional migration note for teams opting into `0.2` writes
- [ ] ROADMAP / CHANGELOG entry when shipped

**Expected tests:**

- [ ] LangChain persistence integration test writes `0.2` lines
- [ ] Adapter events round-trip through CLI `view`
- [ ] No regression in `agent-inspect-callback-persistence.test.ts` behavior

---

## Validation gates (each PR)

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check   # when fixtures change
pnpm recipes:check    # if recipes touched
pnpm compat:smoke     # if package layout touched
```

---

## Out of scope (all PRs)

- LangChain streaming implementation ([#14](https://github.com/rajudandigam/agent-inspect/issues/14))
- Timeline / stats / cohort CLI ([#11](https://github.com/rajudandigam/agent-inspect/issues/11), [#12](https://github.com/rajudandigam/agent-inspect/issues/12))
- CI reporters ([#24](https://github.com/rajudandigam/agent-inspect/issues/24))
- OTLP HTTP sink / vendor upload
- npm major v2 API break
