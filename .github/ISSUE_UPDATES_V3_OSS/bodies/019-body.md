# Update contributor docs with live v3 issue links

**Labels:** `good first issue`, `documentation`, `community contribution`

**Difficulty:** Good first issue

**Milestone:** OSS Hygiene

## Problem

[GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) and [docs/community/GOOD-FIRST-ISSUES.md](./GOOD-FIRST-ISSUES.md) still emphasize batch 01/02 and list **closed** issues (#8, #20, #21, #26) as open. They do not reflect v3 OSS contribution lanes.

## Why it matters

Accurate issue indexes reduce duplicate PRs and help contributors pick scoped, safe work.

## Proposed scope

- Mark completed issues as shipped with links to merged docs/recipes.
- Group live issues by lane: OSS Hygiene, Examples and Fixtures, Adapter SDK Examples, UI/Performance, Standards.
- Link batch 03 drafts under `.github/LIVE_ISSUE_BATCH_03/` once live issue numbers exist.
- Remove or demote stale draft-only references where live issues supersede them.
- Update [docs/community/MONTHLY-OSS-HYGIENE.md](./MONTHLY-OSS-HYGIENE.md) checklist pointers.

## Out of scope

- Bulk-opening all batch 03 issues (maintainer runs script).
- Runtime code changes.

## Suggested files

- `GOOD-FIRST-ISSUES.md`
- `docs/community/GOOD-FIRST-ISSUES.md`
- `docs/community/MONTHLY-OSS-HYGIENE.md`

## Acceptance criteria

- [ ] No closed issues listed as open without "shipped" note
- [ ] Live GitHub `#` links for active work
- [ ] Maintainer-owned section unchanged in substance
- [ ] `pnpm typecheck` and `pnpm test` pass

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Coordinate with maintainer after batch 03 issues are created to fill in live numbers.
