# Extend packed golden-path E2E through report, check, bundle, and verify-safe

**Contribution lane:** testing / examples
**Difficulty:** advanced
**Ownership:** community-owned
**Priority:** p1
**Milestone:** Golden Path & Examples
**Labels:** `testing`, `examples`, `area:core`, `area:release`, `community-owned`, `status:ready`, `difficulty:advanced`, `priority:p1`

## Problem

The packed quickstart currently proves init → demo → list → verify-safe, while the recommended developer path includes report, check, and share-safe bundle steps.

## Why it matters

Packed-artifact E2E is what consumers get from npm; workspace scripts overstate readiness.

## Proposed scope

- Extend packed-artifact E2E using current public commands.
- Prove init/demo/list/view-or-report/check/bundle --profile share/verify-safe.
- Keep runtime bounded and deterministic.
- Do not use workspace-only imports.

## Out of scope

- New CLI commands
- Full Studio browser E2E
- Provider keys
- Changing safety semantics

## Suggested files

- `scripts/packed-quickstart-e2e.mjs`
- `scripts/golden-path-e2e.mjs` (reference only)
- `docs/GOLDEN-PATH.md`
- package.json script wiring if needed

## Acceptance criteria

- [ ] Packed tarball is used
- [ ] All commands are real public commands
- [ ] Generated artifacts are synthetic
- [ ] Failure output is actionable
- [ ] `pack:smoke` remains bounded

## Validation commands

```bash
pnpm build
pnpm pack:smoke
pnpm typecheck
```

## Privacy / network notes

Synthetic local only. Bundle profile must remain share-safe semantics already documented.

## Contributor instructions

Keep wall-clock bounded. Prefer extending packed-quickstart rather than a second unbounded script.

## Maintainer-review boundary

Do not weaken verify-safe / redaction defaults.

