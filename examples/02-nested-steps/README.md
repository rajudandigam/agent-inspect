# Example 02 — Nested execution tree

## What it demonstrates

- **`plan-trip`** is a parent step. Everything awaited inside it (`step.llm`, `parse-plan`, `searchHotels`, `finalize-inside-plan`) is nested in the trace under that parent.
- **`persist-itinerary`** runs **after** `plan-trip` completes, at the **same depth as** `plan-trip` (both are direct children of the run). Compare their `parentId` / tree shape in `agent-inspect view`.

## Run

From repo root: `pnpm build`, then here:

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

## Parent / child

In the trace, `mock-gpt`, `parse-plan`, `searchHotels`, and `finalize-inside-plan` should list `plan-trip`’s step id as `parentId`. `persist-itinerary` should not.
