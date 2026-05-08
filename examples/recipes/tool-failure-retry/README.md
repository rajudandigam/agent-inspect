# Recipe: tool-failure-retry

## What this demonstrates

A **mock tool** that throws on the first call and succeeds on the second—similar to flaky APIs, rate limits, or cold-start failures.

## Why this matters

Flaky tools are common in agent debugging. This recipe shows how failures appear in the trace **before** recovery, so you can correlate user-visible retries with `step_completed` error vs success.

## How to run

```bash
pnpm build
cd examples/recipes/tool-failure-retry
pnpm install
pnpm start
```

## Expected output

See `expected-output.txt`. Final object includes `exportId: fixture-export-ok`.

## What to look for

- First `step.tool` completes with **error** in the trace.
- Retry succeeds without leaving the run as failed if outer logic catches—or inspect nested behavior per your code path.
- Here the tool body retries internally by throwing once only at attempts===1; your production code might use explicit retry loops—same tracing ideas apply.

## Notes and limitations

- Not real HTTP or retries library—single process mock only.
- Compare with **retry-fallback** (LLM vs tool).

## Version ownership

v0.9 adoption hardening (recipes pass 2).
