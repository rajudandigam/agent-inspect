# Unified persisted InspectEvent — implementation checklist

Tracks v1.2.0 release-train chunks for [UNIFIED-PERSISTED-INSPECT-EVENT.md](./UNIFIED-PERSISTED-INSPECT-EVENT.md).

**Execution guide:** [docs/implementation/CURSOR-MAINTAINER-ROADMAP.md](../implementation/CURSOR-MAINTAINER-ROADMAP.md)  
**Release readiness:** [docs/implementation/V1.2.0-RELEASE-READINESS.md](../implementation/V1.2.0-RELEASE-READINESS.md)  
**Publish policy:** Merge chunks to `main`; publish **one** npm release when the full train passes release gates — not per chunk.

---

## PR 1 — Design proposal (completed)

- [x] Create `docs/proposals/UNIFIED-PERSISTED-INSPECT-EVENT.md`
- [x] Create this checklist
- [x] Link from `docs/ARCHITECTURE.md` and `ROADMAP.md`
- [x] No runtime or `schemaVersion: "0.1"` write-path changes

---

## PR 2A — Core types and validator (completed)

- [x] `PersistedInspectEvent` types and `isPersistedInspectEvent`
- [x] Export from `packages/core/src/index.ts`
- [x] `packages/core/test/types/persisted-inspect-event.test.ts`

## PR 2B — Legacy `0.1` TraceEvent converters (completed)

- [x] `traceEventToPersistedInspectEvent` / `traceEventsToPersistedInspectEvents`
- [x] `packages/core/test/persisted/from-trace-event.test.ts`

## PR 2C/2D — InspectEvent ↔ PersistedInspectEvent bridge (completed)

- [x] `inspectEventToPersistedInspectEvent` / `inspectEventsToPersistedInspectEvents`
- [x] `persistedInspectEventToInspectEvent` / `persistedInspectEventsToInspectEvents`
- [x] `packages/core/test/persisted/from-inspect-event.test.ts`
- [x] `packages/core/test/persisted/to-inspect-event.test.ts`

---

## PR 3 — Source-agnostic in-memory tree bridge (completed)

- [x] `persistedInspectEventsToRunTrees` / `traceEventsToPersistedRunTrees`
- [x] Reuse existing `TreeBuilder`
- [x] `packages/core/test/persisted/tree-bridge.test.ts`

---

## v1.2.0 — Shipped (2026-06-11)

- [x] Published to npm as `agent-inspect@1.2.0`
- [x] All foundation chunks (2A–3, release readiness) merged
- [x] Manual trace writing remains `schemaVersion: "0.1"`

## Release readiness — v1.2.0 foundation (completed)

- [x] Public exports (types, validators, converters, tree bridge) from `packages/core/src/index.ts`
- [x] `packages/core/test/api-stability.test.ts` — persisted-event surface
- [x] `fixtures/traces-v0.2/` canonical samples
- [x] `pnpm fixtures:check` validates v0.2 fixtures via `isPersistedInspectEvent`
- [x] `docs/SCHEMA.md` — v0.2 section
- [x] `docs/API.md` — experimental persisted-event helpers
- [x] `docs/ARCHITECTURE.md`, `docs/LIMITATIONS.md` alignment
- [x] `CHANGELOG.md` — `1.2.0` released section
- [x] `docs/implementation/V1.2.0-RELEASE-READINESS.md`
- [x] **No** package version bump, publish, or tag in release-readiness work

---

## v1.3.0 train (current — see [V1.3.0-RELEASE-TRAIN.md](../implementation/V1.3.0-RELEASE-TRAIN.md))

- [ ] Correlation metadata foundation
- [ ] Redaction profiles / share-safe exports
- [ ] LangChain streaming design + metadata-only support ([#14](https://github.com/rajudandigam/agent-inspect/issues/14))

## Future / not complete (post–v1.3)

- [ ] Storage dual-read (`readPersistedEvents`, dual-format line detection)
- [ ] CLI read-path integration (`list`, `view`, `export`, `diff`, `logs`, `tail`)
- [ ] Default `schemaVersion: "0.2"` file writing (`writeTraceEvent` opt-in)
- [ ] LangChain native `0.2` persistence (adapter still writes v0.1 when `persist: true`)
- [ ] LangChain streaming ([#14](https://github.com/rajudandigam/agent-inspect/issues/14))
- [ ] Timeline / stats / cohort CLI
- [ ] CI reporters ([#24](https://github.com/rajudandigam/agent-inspect/issues/24))
- [ ] OTLP HTTP sink / vendor upload

---

## Validation gates (every implementation chunk)

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm fixtures:check   # when fixtures change
pnpm recipes:check    # if recipes touched
pnpm compat:smoke     # if package exports or bundle layout change
pnpm test:all
```

Full publish gate: [V1.2.0-RELEASE-READINESS.md](../implementation/V1.2.0-RELEASE-READINESS.md)

---

## Out of scope (all v1.2.0 chunks)

- LangChain streaming ([#14](https://github.com/rajudandigam/agent-inspect/issues/14))
- Timeline / stats / cohort CLI
- CI reporters ([#24](https://github.com/rajudandigam/agent-inspect/issues/24))
- OTLP HTTP sink / vendor upload
- npm major v2 API break
- Automatic rewrite of existing `0.1` trace files
