# Example 04 — Failed step and error trace

## What it demonstrates

A failing step records `step_completed` / `run_completed` as error, `apply-discount` never runs, and the original error still escapes `inspectRun`—the `try/catch` here is only to print a friendly hint after the fact.

## Run

```bash
pnpm build
cd examples/04-error-handling
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
