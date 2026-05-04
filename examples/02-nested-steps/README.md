# 02-nested-steps

## What it demonstrates

This example shows parent-child execution tree hierarchy. The `plan-trip` step contains an LLM-shaped step and a parse step, while hotel search and finalization are root-level sibling steps.

## Run

From the repo root:

```bash
pnpm build
cd examples/02-nested-steps
pnpm install
pnpm start
```

## Inspect traces

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view run_abc123
```

## Quiet mode

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

Use this example to understand how nested steps become parent-child relationships in the JSONL trace.
