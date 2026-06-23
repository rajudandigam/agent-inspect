# 04-error-handling

## What it demonstrates

This example shows failed step tracking and original error propagation.

A pricing step throws.

agent-inspect records the failed step.

The original error still bubbles out of `inspectRun()`.

![Failed step in the execution tree](../../docs/assets/demos/error-handling.gif)

## Run

From the repo root:

```bash
pnpm build
cd examples/04-error-handling
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

The outer `catch` is only for readable demo output in the console.
