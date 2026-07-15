# Add standards tested-version and known-loss consistency check

**Contribution lane:** docs / testing
**Difficulty:** good first issue
**Ownership:** community-owned
**Priority:** p1
**Support level:** preview
**Milestone:** Standards Evidence
**Labels:** `documentation`, `testing`, `good first issue`, `area:standards`, `community-owned`, `status:ready`, `priority:p1`, `support:preview`

## Problem

Public standards claims can drift without naming tested versions, support level, and known losses.

## Why it matters

Unversioned “compatible with OTel/OpenInference” language is a public-truth hazard.

## Proposed scope

- Create a docs/public-truth check ensuring public standards claims name tested versions, support level, and known losses.
- Audit EXPORTS, STANDARDS, package READMEs, and website source as applicable.

## Out of scope

- Certifying compatibility
- Changing exporters
- Adding vendor SDKs

## Suggested files

- `scripts/validate-public-truth.mjs`
- `docs/STANDARDS.md`
- Package READMEs under `packages/*`
- Website docs source if present

## Acceptance criteria

- [ ] Unversioned or unconditional claims fail validation
- [ ] Known-loss links are consistent
- [ ] `pnpm docs:check` passes

## Validation commands

```bash
pnpm docs:check
pnpm public-truth:check
git diff --check
```

## Privacy / network notes

Docs/validation only. No network defaults change.

## Contributor instructions

Prefer extending validate-public-truth. Comment with the claim patterns you will enforce.

## Maintainer-review boundary

Do not invent certification language.

