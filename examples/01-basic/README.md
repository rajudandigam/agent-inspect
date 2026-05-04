# Example 01 — Basic `inspectRun` + `step`

## What it demonstrates

A single named run with three steps so you see the smallest useful execution tree and printed booking outcome.

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

## Quiet mode

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

Basic run plus three sequential steps (`search-hotels` → `check-availability` → `finalize-booking`).
