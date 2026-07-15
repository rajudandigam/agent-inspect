# Add third-party adapter conformance CI template

**Contribution lane:** docs / adapters
**Difficulty:** intermediate
**Ownership:** community-owned
**Priority:** p2
**Support level:** beta
**Milestone:** Golden Path & Examples
**Labels:** `documentation`, `testing`, `area:adapters`, `community-owned`, `status:ready`, `difficulty:intermediate`, `priority:p2`, `support:beta`

## Problem

Official adapter conformance exists for in-repo adapters, but external adapter authors lack a reusable CI template.

## Why it matters

Third-party adapters need a copyable path: install adapter SDK → conformance → privacy checklist → synthetic fixture → metadata report — without root dependency leakage.

## Proposed scope

- Add a reusable GitHub Actions/template workflow for external adapter repositories:
  install adapter SDK, run conformance, run privacy checklist, validate synthetic fixture, report support/compatibility metadata.

## Out of scope

- Publishing an adapter
- Changing official adapter contracts
- Adding an adapter to root
- Automatic registry approval

## Suggested files

- `docs/ADAPTER-CONFORMANCE.md`
- `packages/adapter-sdk/`
- `examples/adapter-sdk/minimal-source-adapter/`
- New template under `.github/` or `docs/community/` + example workflow

## Acceptance criteria

- [ ] Template is generic
- [ ] No provider keys
- [ ] Uses current adapter SDK/conformance commands
- [ ] External maintainers can copy it

## Validation commands

```bash
pnpm docs:check
pnpm typecheck
# run documented adapter-sdk conformance commands locally if present
```

## Privacy / network notes

Synthetic fixtures. Template must not enable default trace upload.

## Contributor instructions

Treat ADAPTER-CONFORMANCE as source of truth. Do not claim certification.

## Maintainer-review boundary

Official adapter contract changes are maintainer-owned.

