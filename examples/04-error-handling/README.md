# Example 04 — Errors in the trace

## What it demonstrates

- **`fetch-dynamic-pricing`** throws `new Error("Pricing API timeout")` — not caught inside the step.
- The trace includes **`step_completed`** with `status: "error"` and the formatted error for that step, and **`run_completed`** with `status: "error"` for the run.
- The **same** error still propagates out of `inspectRun`; the outer `try/catch` is only for readable console output in this demo.

## Run

```bash
pnpm build   # from repo root once
pnpm install
pnpm start
```

Quiet: `AGENT_INSPECT_SILENT=true pnpm start`

## Inspect

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```
