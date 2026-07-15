# Add writer crash, concurrency, and shutdown regression corpus

**Contribution lane:** testing / core
**Difficulty:** advanced
**Ownership:** community-owned
**Priority:** p1
**Support level:** stable
**Milestone:** 6.7.3 — Correctness & Portability
**Labels:** `testing`, `area:core`, `community-owned`, `status:ready`, `difficulty:advanced`, `priority:p1`, `support:stable`

## Problem

Writer safety guarantees (no-throw into user code, flush/close, concurrent writes) lack a focused crash/concurrency/shutdown regression corpus.

## Why it matters

Malformed-tail corpus (#107) is narrower; overlapping runs and interrupted final events need deterministic coverage.

## Proposed scope

- Add focused reproductions/tests for concurrent writes, interrupted final event, graceful shutdown, and writer no-throw behavior.
- Begin with tests/fixtures.
- Any runtime behavior change requires maintainer acknowledgement.

## Out of scope

- Writer redesign
- New storage backend
- Relaxing safety guarantees

## Suggested files

- Core writer / inspector tests under `packages/core/`
- Related fixtures
- Existing overflow/isolation tests as patterns

## Acceptance criteria

- [ ] Corpus is deterministic
- [ ] Required event integrity is checked
- [ ] User code is not made to fail because instrumentation fails

## Validation commands

```bash
pnpm test
pnpm typecheck
pnpm fixtures:check
```

## Privacy / network notes

Synthetic. No network I/O in writers.

## Contributor instructions

Prefer tests first. Flag any intended runtime change clearly in the PR for maintainer ack.

## Maintainer-review boundary

Runtime writer behavior changes require explicit maintainer acknowledgement.

