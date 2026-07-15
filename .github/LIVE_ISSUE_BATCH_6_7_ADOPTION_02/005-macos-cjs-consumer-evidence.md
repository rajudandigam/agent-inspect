# Record macOS Node 20/22 CJS packed-consumer evidence

**Contribution lane:** testing / release evidence
**Difficulty:** intermediate
**Ownership:** community-owned
**Priority:** p1
**Support level:** stable
**Milestone:** 6.7.3 — Correctness & Portability
**Labels:** `testing`, `area:release`, `community-owned`, `status:ready`, `difficulty:intermediate`, `priority:p1`, `support:stable`

## Problem

The consumer compatibility matrix lacks real macOS CommonJS evidence.

## Why it matters

Root package publishes CJS (`.cjs` / `.d.cts`). macOS CJS packed consumption is still `_pending_` in adoption evidence.

## Proposed scope

- Run packed root-package consumption on macOS using Node 20 or 22.
- Verify CJS `require`, `.d.cts` type resolution, CLI help, and one local trace path.
- Record actual evidence.
- Prefer existing compatibility scripts.

## Out of scope

- Changing the export map without a failing reproduction
- Publishing
- Provider/API integration

## Suggested files

- `scripts/consumer-compat-matrix.mjs`
- `scripts/package-smoke.mjs`
- `docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md`

## Acceptance criteria

- [ ] Actual macOS result recorded
- [ ] CJS runtime and type resolution verified
- [ ] Failure evidence retained if not passing
- [ ] `pnpm compat:smoke` / `pnpm pack:smoke` executed where applicable

## Validation commands

```bash
pnpm build
pnpm pack:smoke
pnpm compat:smoke
pnpm typecheck
```

## Privacy / network notes

Local only. Synthetic traces.

## Contributor instructions

Document macOS version and Node exact version.

## Maintainer-review boundary

Export-map changes require failing evidence and maintainer ack.

