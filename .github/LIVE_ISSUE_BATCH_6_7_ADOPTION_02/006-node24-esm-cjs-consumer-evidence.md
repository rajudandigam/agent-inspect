# Extend packed-consumer compatibility evidence to Node 24 ESM and CJS

**Contribution lane:** testing / release evidence
**Difficulty:** intermediate
**Ownership:** community-owned
**Priority:** p2
**Support level:** stable
**Milestone:** 6.7.3 — Correctness & Portability
**Labels:** `testing`, `area:release`, `community-owned`, `status:ready`, `difficulty:intermediate`, `priority:p2`, `support:stable`

## Problem

Node 24 packed-consumer ESM/CJS results are not recorded even when hosts can run them.

## Why it matters

Official engines remain `>=20`; early Node 24 evidence prevents silent breakage without claiming unsupported support.

## Proposed scope

- Extend or run current packed-consumer checks on Node 24.
- Cover ESM and CJS/type surfaces.
- Record results without changing official engine policy unless separately approved.

## Out of scope

- Changing `engines` field without approval
- Publishing
- Fabricating results

## Suggested files

- `scripts/consumer-compat-matrix.mjs`
- `docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md` (new row or linked note)
- CI docs if adding an optional matrix cell

## Acceptance criteria

- [ ] Both module modes are exercised
- [ ] Evidence is linked/dated
- [ ] No unsupported compatibility claim is introduced

## Validation commands

```bash
pnpm build
pnpm pack:smoke
pnpm typecheck
```

## Privacy / network notes

Local packed install. No default network upload.

## Contributor instructions

Label results clearly as Node 24 evidence, not a change to support policy.

## Maintainer-review boundary

`engines` edits are maintainer-owned.

