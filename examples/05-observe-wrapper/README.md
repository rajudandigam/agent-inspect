# 05-observe-wrapper

## What it demonstrates

This example shows the `observe()` wrapper for agent-like objects. `observe()` tracks the top-level `run()` call, while manual `step()`, `step.tool()`, and `step.llm()` calls provide internal execution-tree detail.

## Run

From the repo root:

```bash
pnpm build
cd examples/05-observe-wrapper
pnpm install
pnpm start
```

## Inspect traces

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view run_abc123
```

## Quiet mode

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## Note

In MVP, `observe()` only wraps top-level `run`, `execute`, and `invoke` methods. Add manual steps inside the agent for nested visibility.
