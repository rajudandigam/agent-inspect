# Add tool failure + retry fixture

**Labels:** `good first issue`, `fixtures`, `examples`

**Difficulty:** Good first issue

## Problem

The repo has a runnable [tool-failure-retry recipe](../../examples/recipes/tool-failure-retry/) but no small **canonical JSONL fixture** under `fixtures/traces/` that documents tool failure and retry patterns for tests, docs, and `agent-inspect view` examples.

## Why it matters

Deterministic fixtures power CI, docs, and contributor onboarding. Tool retry flows are common in agentic systems and deserve a first-class canonical trace separate from recipe-local output.

## Proposed scope

- Add `fixtures/traces/tool-failure-retry.jsonl` (or similar name) with synthetic data:
  - At least one failed tool step (`step_completed` + `status: "error"`)
  - At least one successful retry or fallback step
  - `schemaVersion: "0.1"` compliant events
- Register in `fixtures/traces/README.md` and `scripts/validate-fixtures.mjs` if needed.
- Optional: reference fixture in `docs/GETTING-STARTED.md` or recipe README.

## Out of scope

- Changing core retry semantics or adding automatic retry instrumentation.
- Real API keys or external service calls.
- LangChain adapter changes.

## Suggested files

- `fixtures/traces/tool-failure-retry.jsonl` (new)
- `fixtures/traces/README.md`
- `scripts/validate-fixtures.mjs`
- `examples/recipes/tool-failure-retry/README.md` (optional cross-link)

## Acceptance criteria

- [ ] `pnpm fixtures:check` passes
- [ ] `agent-inspect list --dir fixtures/traces` includes the new run id
- [ ] `agent-inspect view <run-id> --dir fixtures/traces` renders failure + recovery clearly
- [ ] Fixture uses synthetic metadata only (no secrets)

## Validation commands

```bash
pnpm fixtures:check
pnpm test
pnpm build
node packages/cli/dist/index.cjs list --dir fixtures/traces
node packages/cli/dist/index.cjs view <run-id> --dir fixtures/traces
```

## Notes for contributors

- Follow patterns in existing `fixtures/traces/minimal-error.jsonl` and `error-recovery.jsonl`.
- Keep event names aligned with [docs/SCHEMA.md](../../docs/SCHEMA.md) — no `step_failed` event.
