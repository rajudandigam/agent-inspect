# Add large trace-directory warning and performance evidence suite

**Contribution lane:** testing / index / workspace
**Difficulty:** intermediate
**Ownership:** community-owned
**Priority:** p2
**Support level:** beta
**Milestone:** 6.7.3 — Correctness & Portability
**Labels:** `testing`, `fixtures`, `area:index`, `area:workspace`, `community-owned`, `status:ready`, `difficulty:intermediate`, `priority:p2`, `support:beta`

## Problem

Large-directory warnings and performance fixture generation exist, but retained non-flaky evidence covering warning behavior and scan/index parity at selected sizes is incomplete.

## Why it matters

Closed #68 shipped a fixture pack; adoption still needs reproducible evidence without brittle CI microbenchmarks.

## Proposed scope

- Reuse the existing deterministic performance fixture pack (`fixtures/performance/`, `scripts/performance-baseline.mjs`).
- Add evidence/tests for large-directory warning behavior, scan/index parity at selected sizes, and actionable performance output.
- Record timings as evidence without brittle CI microbenchmarks.

## Out of scope

- New database
- Major optimization
- Strict universal performance SLA
- Giant committed fixture files

## Suggested files

- `scripts/performance-baseline.mjs`
- `fixtures/performance/`
- `packages/cli/src/trace-dir-scale.ts` (+ tests)
- Index packages / docs as needed

## Acceptance criteria

- [ ] Existing fixture generation is reused
- [ ] Warnings are tested
- [ ] Index/scan results remain semantically consistent
- [ ] Performance evidence is reproducible and non-flaky

## Validation commands

```bash
pnpm test
pnpm typecheck
pnpm perf:baseline
```

## Privacy / network notes

Synthetic fixtures. Local only.

## Contributor instructions

Avoid asserting hard millisecond SLAs in CI. Prefer thresholds for warning emission and parity.

## Maintainer-review boundary

Major optimization PRs are out of scope for this evidence issue.

