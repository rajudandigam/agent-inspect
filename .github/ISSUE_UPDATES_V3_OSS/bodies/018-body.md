# Add first PR walkthrough for new contributors (v3)

**Labels:** `good first issue`, `documentation`, `community contribution`

**Difficulty:** Good first issue

**Milestone:** OSS Hygiene

## Problem

[CONTRIBUTING.md](../../CONTRIBUTING.md) lists validation commands but there is no step-by-step **first PR walkthrough** for the v3 monorepo (16 packages, recipes, fixtures, adapter-sdk examples, docs-only vs runtime PR paths).

## Why it matters

Lowering friction for first-time contributors supports OSS activation without expanding maintainer review load from surprise scope.

## Proposed scope

- Add `docs/community/FIRST-PR-WALKTHROUGH.md` (or extend CONTRIBUTING) covering: fork → branch → issue comment → local setup (`pnpm install`, `pnpm build`) → validation by PR type → PR template → review expectations.
- Include maintainer-owned boundaries (schema, redaction internals, package exports, official adapters).
- Link from [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Out of scope

- Changing CI workflows.
- Release or publish instructions for contributors.

## Suggested files

- `docs/community/FIRST-PR-WALKTHROUGH.md` (new)
- `CONTRIBUTING.md`
- `GOOD-FIRST-ISSUES.md`

## Acceptance criteria

- [ ] Walkthrough matches current repo layout (v3.5.x)
- [ ] Validation commands accurate for docs-only vs runtime PRs
- [ ] Maintainer-owned areas clearly marked
- [ ] `pnpm typecheck` and `pnpm test` pass

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Small docs-only PR preferred.
