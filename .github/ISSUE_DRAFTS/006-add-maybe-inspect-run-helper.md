# Add `maybeInspectRun` helper

## Problem

Call sites often wrap `inspectRun` in `if (process.env.DEBUG)` or similar, duplicating boilerplate and risking inconsistent opt-out behavior.

## Why it matters

A small convenience API improves adoption when tracing is environment-gated, especially once `enabled` exists on `InspectRunOptions`.

## Proposed scope

- Add `maybeInspectRun(condition, name, fn, options?)` that delegates to `inspectRun` when `condition` is truthy, else runs `fn` directly.
- Re-export from `packages/core/src/index.ts`.
- Document as stable convenience wrapper in `docs/API.md` (depends on `enabled` semantics or implements equivalent).

## Out of scope

- Auto-reading env vars inside core (callers pass explicit `condition`).
- Changing default `inspectRun` behavior.

## Acceptance criteria

- [ ] `maybeInspectRun(false, ...)` produces no trace file
- [ ] `maybeInspectRun(true, ...)` matches `inspectRun` behavior
- [ ] TypeScript types mirror `inspectRun` generics/return type
- [ ] Tests added
- [ ] Documented in `docs/API.md`

## Suggested files

- `packages/core/src/inspect-run.ts` or new `maybe-inspect-run.ts`
- `packages/core/src/index.ts`
- `packages/core/test/inspect-run.test.ts`
- `docs/API.md`

## Tests to add

- Condition false/true paths
- Error propagation unchanged

## Labels

`maintainer-owned`, `enhancement`, `api`

## Difficulty

**Maintainer-owned**
