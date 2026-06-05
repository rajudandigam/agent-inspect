# Add schema version FAQ

## Problem

Users see `schemaVersion: "0.1"` in JSONL traces and may assume it matches the npm package version (1.0.x) or expect a `step_failed` event.

## Why it matters

Clear FAQ reduces confusion and prevents contributors from proposing breaking schema changes without a major version plan.

## Proposed scope

- Add FAQ section to `docs/SCHEMA.md` or new `docs/SCHEMA-FAQ.md` linked from SCHEMA and README.
- Cover: trace schema vs package semver, stable event names, failure representation, additive evolution policy.
- Link to `docs/MIGRATION.md`.

## Out of scope

- Changing `schemaVersion` value.
- Implementing `step_failed`.

## Acceptance criteria

- [ ] FAQ answers: "Why 0.1 in a 1.0 package?", "What events exist?", "How are errors recorded?"
- [ ] Linked from `docs/SCHEMA.md` and Documentation section if appropriate
- [ ] No internal `docs-local` links as primary user path

## Suggested files

- `docs/SCHEMA.md`
- Optionally `docs/MIGRATION.md` (cross-link)
- `README.md` (one-line link only if needed)

## Tests to add

- None required (docs-only). Run `pnpm typecheck` + `pnpm test`.

## Labels

`documentation`, `good first issue`

## Difficulty

**Good first issue**
