# Recipe: retry-fallback

## What this demonstrates

A **primary LLM** step that fails (throws) and a **fallback LLM** step that returns a stub string. This is about **model routing / backup providers**, not tool HTTP retries.

## Why this matters

Operators often add a “cheap / local” model when the primary errors. The trace should show **which** model path ran and where the error happened.

## How to run

```bash
pnpm build
cd examples/recipes/retry-fallback
pnpm install
pnpm start
```

## Expected output

`Final answer: fixture fallback answer` (see `expected-output.txt`).

## What to look for

- `primary-llm` completes with **error** in the JSONL trace.
- `fallback-llm` completes with **success**.
- Final run status **success** because the outer step catches and continues.

## Notes and limitations

- Not the OpenAI SDK—pure throws + mocks.
- Compare with **tool-failure-retry** for flaky HTTP/tools.

## Version ownership

v0.9 adoption hardening (recipes pass 2).
