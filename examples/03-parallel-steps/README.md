# 03-parallel-steps

## What it demonstrates

This example shows `Promise.all` sibling isolation. Three parallel tool steps run under the same parent step without corrupting each other's parent IDs.

## Run

From the repo root:

    pnpm build
    cd examples/03-parallel-steps
    pnpm install
    pnpm start

## Inspect traces

    node ../../packages/cli/dist/index.cjs list
    node ../../packages/cli/dist/index.cjs view run_abc123

## Quiet mode

    AGENT_INSPECT_SILENT=true pnpm start

## Note

The three tool steps should share the same parent in the trace because they run inside `collect-context`.
