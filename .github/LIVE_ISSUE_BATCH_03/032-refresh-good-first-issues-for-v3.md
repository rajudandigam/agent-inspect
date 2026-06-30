# Refresh GOOD-FIRST-ISSUES.md for v3

**Labels:** `documentation`, `community contribution`, `good first issue`

**Difficulty:** Good first issue

**Milestone:** OSS Hygiene

## Problem

Good-first-issue indexes list closed work as open and use batch 01/02 framing from pre-v3 activation.

## Why it matters

Contributors need accurate live `#` links grouped by OSS lane.

## Proposed scope

- Update `GOOD-FIRST-ISSUES.md` and `docs/community/GOOD-FIRST-ISSUES.md`.
- Mark shipped issues (#8, #20, #21, #26, and closed superseded items) with links to docs/recipes.
- Group open issues by lane; link batch 03 when live.
- Keep maintainer-owned section.

## Out of scope

- Bulk GitHub issue creation (maintainer script).

## Suggested files

- `GOOD-FIRST-ISSUES.md`
- `docs/community/GOOD-FIRST-ISSUES.md`

## Acceptance criteria

- [ ] No stale open references to closed issues
- [ ] Lane groupings match [ISSUE-HYGIENE-PLAN.md](../../docs/community/ISSUE-HYGIENE-PLAN.md)
- [ ] `pnpm typecheck` and `pnpm test` pass

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

Comment on this issue before opening a PR.
