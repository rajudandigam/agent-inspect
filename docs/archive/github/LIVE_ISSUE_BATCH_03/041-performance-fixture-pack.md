# Performance fixture pack

**Labels:** `performance`, `fixtures`, `testing`, `help wanted`

**Difficulty:** Intermediate

**Milestone:** UI and Performance Polish

## Problem

`pnpm perf:baseline` uses inline fake data; there is no **deterministic small/medium/large trace fixture set** documented for perf regression and scale warnings.

## Proposed scope

- Add `fixtures/performance/` (or extend `fixtures/traces/`) with small/medium/large deterministic JSONL sets.
- Document usage with `pnpm perf:baseline` and [docs/PERFORMANCE.md](../../docs/PERFORMANCE.md).
- Wire into `pnpm fixtures:check` if new paths need validation.
- Reframe/supersede intent of #28 (multi-run fixture pack).

## Out of scope

- Giant multi-MB trace files in git.
- Runtime perf optimizations (separate maintainer work).

## Acceptance criteria

- [ ] Three size tiers documented
- [ ] `pnpm fixtures:check` passes
- [ ] perf:baseline can reference fixture paths (doc or script comment)

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
pnpm perf:baseline
```

## Notes for contributors

Comment before opening a PR. Keep files small but representative.
