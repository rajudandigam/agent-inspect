# 05-observe-wrapper

## What it demonstrates

This example shows the `observe()` top-level wrapper for agent-like objects.

`observe()` tracks the top-level `run()` call.

Manual `step()`, `step.tool()`, and `step.llm()` calls add internal execution-tree detail.

![observe() wrapper tracing an agent-like object](../../docs/assets/demos/observe-wrapper.gif)

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

In MVP, `observe()` wraps top-level `run`, `execute`, and `invoke` only.

Add manual steps inside the class for nested visibility.
