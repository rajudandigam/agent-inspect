# Example 03 — `Promise.all` sibling steps

## What it demonstrates

Under `collect-context`, three tool steps run in parallel and share the same `parentId` in JSONL; `merge-context` runs afterward as another child of that parent.

## Run

```bash
pnpm build
cd examples/03-parallel-steps
pnpm install
pnpm start

Inspect traces
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
Quiet mode
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

`Promise.all` sibling `parentId` isolation: parallel tools share one parent; merge runs after they complete.
