# Example 03 — `Promise.all` sibling steps

## What it demonstrates

Under **`collect-context`**, three tool steps run concurrently. In the trace they should share the **same `parentId`** (the `collect-context` step) and have **different** `stepId` values—no crossed wires thanks to scoped step context.

**`merge-context`** runs only after all parallel steps finish.

## Run

Repo root: `pnpm build`, then:

```bash
pnpm install
pnpm start
```

Quiet: `AGENT_INSPECT_SILENT=true pnpm start`

## Inspect

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```
