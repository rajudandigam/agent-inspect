# Example 03 — `Promise.all` sibling steps

## What it demonstrates

Under **`collect-context`**, `fetchWeather`, `fetchEvents`, and `fetchHotelPrices` run in parallel. In the JSONL trace they share the **same `parentId`** (the `collect-context` step). **`merge-context`** runs only after all three finish.

## How to run

```bash
pnpm build
cd examples/03-parallel-steps
pnpm install
pnpm start
```

## How to inspect

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```

## Note

Use `AGENT_INSPECT_SILENT=true pnpm start` for quiet output.
