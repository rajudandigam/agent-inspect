# 01-basic

## What it demonstrates

This example shows the smallest useful `inspectRun()` + `step()` workflow. It models a simple hotel booking flow with search, availability, and finalize steps.

## Run

From the repo root:

    pnpm build
    cd examples/01-basic
    pnpm install
    pnpm start

## Inspect traces

    node ../../packages/cli/dist/index.cjs list
    node ../../packages/cli/dist/index.cjs view run_abc123

## Quiet mode

    AGENT_INSPECT_SILENT=true pnpm start

## Note

This example demonstrates a basic run with sequential steps.
