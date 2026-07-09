# Recipe: trace-suite-basic

## What this demonstrates

A local trace suite config (`agent-inspect.suite.json`) that runs deterministic checks over existing traces — including observed outcomes — without replaying agents or calling model providers.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/trace-suite-basic
pnpm install
pnpm start
```

## Expected output

See `expected-output.txt`.

## Boundaries

- Reads existing traces only; no network, no provider SDK, no replay.
- Suite artifacts are written under `.agent-inspect/suite-runs/` when using `suite run`.
