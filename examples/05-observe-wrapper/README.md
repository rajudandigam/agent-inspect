# Example 05 — `observe()` wrapper

## What it demonstrates

`observe()` wraps top-level `run()`. Triage (`step`), retrieval (`step.tool`), and reply (`step.llm`) add internal execution-tree detail under that run.

## Run

```bash
pnpm build
cd examples/05-observe-wrapper
pnpm install
pnpm start

Inspect traces
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
Quiet mode
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

`observe` is top-level in MVP; internal detail uses `step()`, `step.tool()`, and `step.llm()`.
