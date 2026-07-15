# Sync pre-v7 pilot kit and adoption-evidence docs to 6.7.3

**Contribution lane:** docs / release truth
**Difficulty:** good first issue
**Ownership:** community-owned
**Priority:** p1
**Milestone:** External Pilot & Adoption
**Labels:** `documentation`, `testing`, `good first issue`, `area:community`, `area:release`, `community-owned`, `status:ready`, `priority:p1`

## Problem

Pilot-facing docs still contain older 6.7.0/6.7.1 references even though the public fixed release is **6.7.3**. Community indexes still say 6.7.2.

## Why it matters

Pilots following stale install pins report against the wrong artifact; public-truth drifts; maintainers cannot trust dated findings.

## Proposed scope

- Audit `docs/PRE-V7-PILOT-KIT.md`, `docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md`, `docs/DESIGN-PARTNER-GUIDE.md`, `docs/DEMO-SCRIPT.md`, and related public links.
- Align current install commands and version references to **6.7.3** where they mean “current release”.
- Extend `scripts/validate-public-truth.mjs` (or related checks) so future pilot-version drift is caught.
- Preserve pending evidence rows as `_pending_`.
- Keep historical notes explicitly historical.

## Out of scope

- Changing release policy or package versions
- Marking pilot gates complete
- Rewriting historical audit records as if they were contemporaneous

## Suggested files

- `docs/PRE-V7-PILOT-KIT.md`
- `docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md`
- `docs/DESIGN-PARTNER-GUIDE.md`
- `docs/DEMO-SCRIPT.md`
- `scripts/validate-public-truth.mjs`
- Optionally community indexes if they still claim 6.7.2 as current

## Acceptance criteria

- [ ] Current pilot commands use 6.7.3 where appropriate
- [ ] Historical references remain explicitly historical
- [ ] Pending evidence remains pending
- [ ] A regression check detects future current-version drift in pilot kit docs
- [ ] `pnpm docs:check` / `pnpm public-truth:check` pass

## Validation commands

```bash
pnpm docs:check
pnpm public-truth:check
pnpm typecheck
git diff --check
```

## Privacy / network notes

Docs-only. No network defaults change. Do not invent pilot results.

## Contributor instructions

Comment first. Prefer small, reviewable diffs. Quote the published version from root `package.json` (6.7.3).

## Maintainer-review boundary

Do not edit CHANGELOG release notes into fiction. Do not change npm package versions.

