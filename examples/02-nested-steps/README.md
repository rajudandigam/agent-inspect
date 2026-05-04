# Example 02 — Nested execution tree

## What it demonstrates

`plan-trip` nests `mock-gpt` and `parse-plan`; `searchHotels` and `finalize` are separate root-level steps so parent/child vs siblings is clear in the trace.

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

## Quiet mode

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

Parent–child execution tree: nested steps under `plan-trip`, then siblings at the run root.
