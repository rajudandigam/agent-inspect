# Add event size bounds

## Problem

Large `metadata` blobs or accidental circular structures serialized into trace events can produce very large JSONL lines and disk growth.

## Why it matters

Local-first tooling should still protect developers from runaway trace files on developer machines and CI artifacts.

## Proposed scope

- Define max serialized event size (or per-field metadata limits) in `storage.ts` / `validateEvent`.
- Truncate or drop oversized metadata with `warn()` — never throw into user code.
- Document limits in `docs/SCHEMA.md` and `docs/LIMITATIONS.md`.

## Out of scope

- Compression or external object stores.
- Rejecting entire runs (prefer warn + truncate/drop field).
- Changing event names or schema version.

## Acceptance criteria

- [ ] Oversized metadata handled gracefully
- [ ] Valid events under limit unchanged
- [ ] Tests for boundary behavior
- [ ] Documented limits (bytes or depth)

## Suggested files

- `packages/core/src/storage.ts`
- `packages/core/src/utils.ts` (optional helper)
- `packages/core/test/storage.test.ts`
- `docs/SCHEMA.md`
- `docs/LIMITATIONS.md`

## Tests to add

- Event at limit passes
- Event over limit warns and truncates/skips metadata

## Labels

`maintainer-owned`, `security`, `enhancement`

## Difficulty

**Maintainer-owned**
