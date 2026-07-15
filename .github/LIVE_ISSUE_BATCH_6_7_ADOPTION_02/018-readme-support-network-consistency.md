# Add package README support-level and network-behavior consistency check

**Contribution lane:** docs / release truth
**Difficulty:** good first issue
**Ownership:** community-owned
**Priority:** p2
**Milestone:** Contributor Experience — 2026 Q3
**Labels:** `documentation`, `testing`, `good first issue`, `area:release`, `area:community`, `community-owned`, `status:ready`, `priority:p2`

## Problem

Public package READMEs can drift from SUPPORT-LEVELS and NETWORK-BEHAVIOR without failing CI.

## Why it matters

False “zero network” claims or overstated maturity undermine trust.

## Proposed scope

- Audit public package READMEs against `docs/SUPPORT-LEVELS.md` and `docs/NETWORK-BEHAVIOR.md`.
- Extend docs/public-truth validation so package maturity and opt-in network behavior cannot drift silently.

## Out of scope

- Changing support levels
- Changing network defaults
- Rewriting all package READMEs wholesale

## Suggested files

- `docs/SUPPORT-LEVELS.md`
- `docs/NETWORK-BEHAVIOR.md`
- `packages/*/README.md` and root README as needed
- `scripts/validate-public-truth.mjs`

## Acceptance criteria

- [ ] Current mismatches are fixed or explicitly documented
- [ ] Validation catches future drift
- [ ] No false claim of zero network for explicitly networked optional surfaces

## Validation commands

```bash
pnpm docs:check
pnpm public-truth:check
git diff --check
```

## Privacy / network notes

Do not weaken network defaults. Document opt-in accurately.

## Contributor instructions

Start with an audit table in the PR description. Prefer checks over prose-only fixes.

## Maintainer-review boundary

Support-level reclassification is maintainer-owned.

