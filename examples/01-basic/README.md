# Example 01 — Basic `inspectRun` + `step`

## What it demonstrates

A single named run with three steps: the smallest useful execution tree, plus the printed booking confirmation from `inspectRun`.

## Run

```bash
pnpm build
cd examples/01-basic
pnpm install
pnpm start

Inspect traces
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
Quiet mode
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

Basic run plus three sequential steps (`search-hotels` → `check-availability` → `finalize-booking`).
