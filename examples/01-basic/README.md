# Example 01 — Basic `inspectRun` + `step`

## What it demonstrates

One named run with three steps—search, availability check, finalize—so you see a minimal execution tree and timings in the trace.

## Run

```bash
pnpm build
cd examples/01-basic
pnpm install
pnpm start
```

## Inspect traces

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```

## Note

Terminal output is on by default. Use `AGENT_INSPECT_SILENT=true pnpm start` for quiet runs.
