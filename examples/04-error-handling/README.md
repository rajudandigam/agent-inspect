# 04-error-handling

## What it demonstrates

This example shows failed step tracking and original error propagation. A pricing step throws, AgentInspect records the failed step, and the original error still bubbles out of `inspectRun()`.

## Run

From the repo root:

    pnpm build
    cd examples/04-error-handling
    pnpm install
    pnpm start

## Inspect traces

    node ../../packages/cli/dist/index.cjs list
    node ../../packages/cli/dist/index.cjs view run_abc123

## Quiet mode

    AGENT_INSPECT_SILENT=true pnpm start

## Note

The trace should contain both a failed `step_completed` event and a failed `run_completed` event.
