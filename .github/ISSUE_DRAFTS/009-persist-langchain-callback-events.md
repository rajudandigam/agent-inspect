# Persist LangChain callback events to JSONL

## Problem

`AgentInspectCallback` stores events in memory via `getEvents()` / `clear()`. They are not written to the manual JSONL trace format used by `list` / `view` / `export` / `diff`.

## Why it matters

Teams using LangChain want a single local inspection workflow — not a separate in-memory-only event list.

## Proposed scope

- Optional persistence mode on `AgentInspectCallback` (e.g. `persist: "jsonl"` + `traceDir`).
- Map `InspectEvent` → trace lines or documented parallel JSONL extension (maintainer decision on unified vs adapter-specific file).
- Experimental API — document in `docs/ADAPTERS.md`.
- Update `examples/08-langchain-adapter`.

## Out of scope

- Vendor upload sinks.
- Full OpenTelemetry span mapping in this issue.
- Declaring adapter API stable.
- Breaking `schemaVersion: "0.1"` manual events without migration plan.

## Acceptance criteria

- [ ] Opt-in persistence writes local files
- [ ] `agent-inspect list` / `view` can inspect persisted adapter runs (or documented limitation)
- [ ] Default remains in-memory only
- [ ] Tests in `agent-inspect-callback.test.ts`
- [ ] Design note for unified persisted event model linked in PR

## Suggested files

- `packages/langchain/src/agent-inspect-callback.ts`
- `packages/langchain/src/types.ts`
- `packages/core/src/exporters/manual-trace-adapter.ts` (possible bridge)
- `packages/langchain/test/agent-inspect-callback.test.ts`
- `docs/ADAPTERS.md`
- `examples/08-langchain-adapter/`

## Tests to add

- Persist enabled writes file
- Default in-memory unchanged
- Redaction applied if metadata captured

## Labels

`maintainer-owned`, `langchain`, `enhancement`

## Difficulty

**Maintainer-owned**
