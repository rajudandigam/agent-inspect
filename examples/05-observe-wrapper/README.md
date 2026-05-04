# Example 05 — `observe()` wrapper

## What it demonstrates

`observe()` wraps top-level `run()`; triage, tool, and LLM-shaped steps inside the class add internal execution-tree detail under that run.

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

## Quiet mode

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

`observe` is top-level only in MVP; internal detail uses `step()`, `step.tool()`, and `step.llm()`.
