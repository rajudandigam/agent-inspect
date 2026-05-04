# Example 04 — Failed step and error trace

## What it demonstrates

- **`fetch-dynamic-pricing`** throws `new Error("Pricing API timeout")` (not caught inside the step).
- The trace records **`step_completed`** with `status: "error"` for that step and **`run_completed`** with `status: "error"` for the run.
- **`apply-discount`** never runs.
- The error still propagates out of `inspectRun`; the outer `try/catch` only prints a short message for the demo.

## How to run

```bash
pnpm build
cd examples/04-error-handling
pnpm install
pnpm start
```

## How to inspect

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```

## Note

Use `AGENT_INSPECT_SILENT=true pnpm start` for quiet output.
