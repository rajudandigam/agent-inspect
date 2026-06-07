# Update contributor docs with live issue links

**Labels:** `good first issue`, `documentation`, `community contribution`

**Difficulty:** Good first issue

## Problem

Contributor docs still reference draft issue files and batch body paths more prominently than live GitHub issues. After batch 02 is created, maintainers need live `#NNN` links in curated contributor entry points.

## Why it matters

Contributors should pick **live issues**, not hunt draft markdown. Completed issues must not appear as open work. Maintainer-owned areas must stay clearly separated.

## Proposed scope

- Update [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) with live links for current open issues (batch 01 and, after creation, batch 02).
- Update [docs/community/GOOD-FIRST-ISSUES.md](../../docs/community/GOOD-FIRST-ISSUES.md) to mirror the same structure.
- Reference **closed/completed** issues as examples only (not open work) where helpful.
- Keep `.github/ISSUE_DRAFTS/` and `.github/LIVE_ISSUE_BATCH_0x/` as source-material links only.
- Optionally update [ROADMAP.md](../../ROADMAP.md) Now section if batch 02 issues map to roadmap items.

## Out of scope

- No runtime code changes.
- No new GitHub issues created by this PR (maintainers create issues separately).
- No marking in-progress issues as completed.

## Suggested files

- `GOOD-FIRST-ISSUES.md`
- `docs/community/GOOD-FIRST-ISSUES.md`
- `ROADMAP.md` (optional, if links add clarity)

## Acceptance criteria

- [ ] Live issues are easy to find from contributor docs
- [ ] Completed issues are not presented as open work
- [ ] Maintainer-owned work is clearly separated
- [ ] Draft/batch files remain as historical source links

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

- Comment on this issue before opening a PR — coordinate with maintainers if batch 02 issue numbers are not yet assigned.
- Docs-only PR; verify all GitHub links resolve.

## Maintainer note

Run this update immediately after `scripts/create-live-issues-batch-02.sh`, or fold link updates into the PR that prepares batch 02 bodies. Defer issue 002 if links were already updated for batch 01 only.
