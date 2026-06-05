# Add `enabled` option to `inspectRun`

## Problem

`inspectRun` always traces by default (writes JSONL, emits terminal progress unless `silent`). Some teams need an explicit opt-out for production code paths or feature-flagged debugging without removing instrumentation calls.

## Why it matters

Ergonomic opt-out reduces friction for teams that want tracing in dev/staging only, while keeping default behavior safe and on for inner-loop debugging.

## Proposed scope

- Add `enabled?: boolean` to `InspectRunOptions` (default `true` when omitted).
- When `enabled: false`, run `fn` with no trace file writes and no terminal progress (no-op instrumentation).
- Document in `docs/API.md` as stable additive option.
- JSDoc on `inspectRun`.

## Out of scope

- Changing default to `enabled: false`.
- Removing `silent` option semantics.
- Vendor sinks or remote upload.
- `step_failed` event.

## Acceptance criteria

- [ ] Default behavior unchanged when `enabled` omitted
- [ ] `enabled: false` skips `run_started` / `run_completed` / file init
- [ ] User errors still propagate from `fn`
- [ ] Tests in `inspect-run.test.ts`
- [ ] `api-stability.test.ts` updated if options type exported
- [ ] `docs/API.md` + `CHANGELOG.md` (changeset by maintainer)

## Suggested files

- `packages/core/src/types.ts` (`InspectRunOptions`)
- `packages/core/src/inspect-run.ts`
- `packages/core/test/inspect-run.test.ts`
- `docs/API.md`

## Tests to add

- `enabled: false` does not create trace file
- `enabled: true` unchanged behavior
- Instrumentation safety preserved

## Labels

`maintainer-owned`, `enhancement`, `api`

## Difficulty

**Maintainer-owned**
