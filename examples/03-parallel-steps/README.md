# 03-parallel-steps

## What it demonstrates

This example shows `Promise.all` sibling isolation.

Three tool steps run in parallel under one parent.

They share the same parent step id in the trace without corrupting each other.

![Parallel tool steps under one parent](../../docs/assets/demos/parallel-execution.gif)

## Run

From the repo root:

```bash
pnpm build
cd examples/03-parallel-steps
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

Compare sibling tool steps under `collect-context` with the later `merge-context` child.
