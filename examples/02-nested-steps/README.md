# Example 02 — Nested execution tree

## What it demonstrates

`plan-trip` nests `mock-gpt` and `parse-plan`. `searchHotels` and `finalize` are root-level siblings under the run so parent/child vs siblings is easy to read in the trace.

## Run

```bash
pnpm build
cd examples/02-nested-steps
pnpm install
pnpm start

Inspect traces
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
Quiet mode
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

Parent–child execution tree under `plan-trip`, then root-level sibling steps.
