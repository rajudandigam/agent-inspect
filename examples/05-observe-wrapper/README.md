# Example 05 — `observe()` wrapper

## What it demonstrates

`observe()` adds a traced boundary around each top-level `run()`; internal `step`, `step.tool`, and `step.llm` calls add structure under that run so you still get an execution tree in MVP without framework adapters.

## Run

```bash
pnpm build
cd examples/05-observe-wrapper
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
