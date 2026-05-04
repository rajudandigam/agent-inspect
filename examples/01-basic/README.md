# Example 01 — Basic `inspectRun` + `step`

## What it demonstrates

The smallest useful pattern: one named run and three steps (`search-hotels`, `check-availability`, `finalize-booking`). Each step appears in the JSONL trace with timing.

## How to run

From the **repository root**:

```bash
pnpm build
```

Then:

```bash
cd examples/01-basic
pnpm install
pnpm start
```

## How to inspect traces

From this directory:

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```

## Note

Examples show AgentInspect **terminal** output by default. For quiet output:

```bash
AGENT_INSPECT_SILENT=true pnpm start
```
