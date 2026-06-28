# Session workflow fixtures (v2.4)

Deterministic multi-run samples for `buildSessionIndex` and session CLI tests.

## Layout

Each scenario is a directory of **separate run JSONL files** (one run per file), matching how traces appear on disk.

| Directory | Scenario |
| --------- | -------- |
| `multi-agent-handoff/` | Planner run hands off to worker run via explicit `handoffFrom` / `handoffTo` |
| `retry-attempts/` | Two runs in one session; second attempt references `retryOf` |

## Rules

- Manual v0.1 `schemaVersion` traces only in this train.
- Session metadata lives on `run_started.metadata`.
- No secrets, real emails, or production logs.
- IDs are synthetic fixture values only.

## Validation

Loaded in `packages/core/test/sessions/` and future `pnpm fixtures:check` extensions.
