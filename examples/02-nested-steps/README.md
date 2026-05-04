# Example 02 — Nested execution tree

## What it demonstrates

- **`plan-trip`** wraps `step.llm("mock-gpt")` and `step("parse-plan")` — both are **children** of `plan-trip` in the trace.
- **`searchHotels`** (`step.tool`) and **`finalize`** run **after** `plan-trip` completes, at the **same depth as** `plan-trip` under the run (siblings of `plan-trip`, not nested inside it).

## How to run

```bash
pnpm build
cd examples/02-nested-steps
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
