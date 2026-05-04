# Example 02 — Nested execution tree

## What it demonstrates

`plan-trip` nests an LLM-shaped step and `parse-plan` under one parent; `searchHotels` and `finalize` run afterward as separate root-level steps, so the JSONL tree clearly separates “planning subtree” from “booking follow-up.”

## Run

```bash
pnpm build
cd examples/02-nested-steps
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
