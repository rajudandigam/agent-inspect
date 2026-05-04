# Example 04 — Failed step and error trace

## What it demonstrates

A failing step records error status in the trace; `apply-discount` never runs; the original error still leaves `inspectRun` (the outer `catch` is only for demo output).

## Run

```bash
pnpm build
cd examples/04-error-handling
pnpm install
pnpm start

Inspect traces
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
Quiet mode
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

Failed step plus original error propagation; inspect the trace for the failed `fetch-dynamic-pricing` step.
