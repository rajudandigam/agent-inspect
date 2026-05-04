# Example 03 — `Promise.all` sibling steps

## What it demonstrates

Inside `collect-context`, three tool steps run in parallel and share the same parent in the trace; `merge-context` runs after they finish as another child of the same parent—so you see parallel siblings plus one sequential follow-up under one subtree.

## Run

```bash
pnpm build
cd examples/03-parallel-steps
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
