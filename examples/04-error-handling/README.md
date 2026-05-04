# Example 04 — Failed step and error trace

## What it demonstrates

A failing step records error status in the trace; `apply-discount` never runs; the original error still leaves `inspectRun` (the `catch` is only for demo messages).

## Run

```bash
pnpm build
cd examples/04-error-handling
pnpm install
pnpm start
```

## Inspect traces

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```

## Quiet mode

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

Failed step plus original error propagation; inspect `step_completed` / `run_completed` in the trace.
