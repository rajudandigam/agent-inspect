# Add retry and circuit-breaker fixture pack

**Labels:** `good first issue`, `fixtures`, `examples`, `testing`

**Difficulty:** Good first issue

**Milestone:** Examples and Fixtures

## Problem

The repo ships `examples/recipes/tool-failure-retry/` and `fixtures/traces/error-recovery.jsonl`, but there is no **canonical multi-scenario fixture pack** aligned with v2.5+ `@agent-inspect/circuit` analyzers and current schema 1.0 conventions.

## Why it matters

Deterministic retry/circuit fixtures help docs, tests, and CI examples without real flaky services or network calls.

## Proposed scope

- Add or extend fixtures under `fixtures/traces/` or `fixtures/sessions/` covering: tool failure → retry success, repeated tool args (circuit signal), timeout/stall patterns (metadata-only).
- Reference fixtures from `fixtures/README.md` and optionally `docs/USE-CASES.md`.
- Add or extend tests that load fixtures via existing validation (`pnpm fixtures:check`).
- Cross-link existing `tool-failure-retry` and `circuit-breaker-basic` recipes — do not duplicate runnable recipes.

## Out of scope

- Changing circuit analyzer algorithms.
- Network calls or real API keys.
- Production monitoring semantics.

## Suggested files

- `fixtures/traces/` or `fixtures/sessions/`
- `fixtures/README.md`
- `packages/core/test/fixtures/fixture-validation.test.ts` (if assertions needed)

## Acceptance criteria

- [ ] `pnpm fixtures:check` passes
- [ ] Synthetic data only; no secrets
- [ ] Docs reference fixture paths and example CLI (`check`, `circuit` if applicable)
- [ ] Existing recipes remain the runnable entry points

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
```

## Notes for contributors

- Comment on this issue before opening a PR.
- `examples/recipes/tool-failure-retry/` already demonstrates the pattern — this issue is **fixture canon**, not a new recipe unless gaps require it.
