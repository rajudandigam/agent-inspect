# Recipe: cohort-baseline-candidate

## What this demonstrates

Compare baseline vs candidate trace cohorts with `agent-inspect cohort` — detecting tool-choice drift, error-rate regressions, and observation failures from local JSONL traces only.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/cohort-baseline-candidate
pnpm install
pnpm start
```

## Expected output

See `expected-output.txt`. The command exits with code **1** when regressions are detected.

## Boundaries

- Reads existing traces only; no network, no provider SDK, no replay.
- Optional artifacts: `cohort-results.json`, `cohort-summary.md`, `cohort-report.html` via `--output`.
