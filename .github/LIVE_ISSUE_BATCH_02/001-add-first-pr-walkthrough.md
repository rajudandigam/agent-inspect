# Add first PR walkthrough for new contributors

**Labels:** `good first issue`, `documentation`, `community contribution`

**Difficulty:** Good first issue

## Problem

New contributors need a concrete fork-to-PR walkthrough specific to AgentInspect — not generic GitHub docs alone. The repo has validation commands, recipe/fixture patterns, and maintainer-owned boundaries that are easy to miss on a first PR.

## Why it matters

Batch 01 produced external contributions. A focused walkthrough lowers friction for docs-only, fixture, and recipe PRs while reinforcing comment-before-PR and validation expectations.

## Proposed scope

- Add `docs/community/FIRST-PR-WALKTHROUGH.md`.
- Explain fork, branch, `pnpm install`, build/test, commit, push, and opening a PR against `main`.
- Include three example paths:
  - **Docs-only** PR (e.g. cookbook or checklist)
  - **Fixture** PR (`fixtures/` + `pnpm fixtures:check`)
  - **Recipe** PR (`examples/recipes/` + `pnpm recipes:check`)
- Include validation commands from [CONTRIBUTING.md](../../CONTRIBUTING.md).
- Explain maintainer review expectations (scope, no surprise runtime changes, redaction before sharing traces).

## Out of scope

- No runtime code changes in this issue.
- No GitHub permission or org settings changes.
- No fake contributor entries in [CONTRIBUTORS.md](../../docs/community/CONTRIBUTORS.md).

## Suggested files

- `docs/community/FIRST-PR-WALKTHROUGH.md` (new)
- Link from [CONTRIBUTING.md](../../CONTRIBUTING.md) and [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)

## Acceptance criteria

- [ ] Walkthrough explains contributor-side flow end to end
- [ ] Walkthrough explains maintainer review expectations
- [ ] Includes docs-only, fixture, and recipe PR examples
- [ ] No fake contributors listed
- [ ] No runtime code changes

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Match tone and structure of existing community docs in `docs/community/`.
- Keep AgentInspect boundaries honest: local-first, no vendor upload, no SaaS scope.

## Maintainer note

After merge, link the walkthrough from README Contributing section if not already present.
