# Example 05 — `observe()` wrapper

## What it demonstrates

- **`observe()`** wraps the agent so each **`run()`** is traced as a top-level run (MVP: only `run` / `execute` / `invoke` are auto-wrapped).
- **`step()`**, **`step.tool()`**, and **`step.llm()`** inside **`run()`** add internal nodes under that run.

## How to run

```bash
pnpm build
cd examples/05-observe-wrapper
pnpm install
pnpm start
```

## How to inspect

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```

## Note

Use `AGENT_INSPECT_SILENT=true pnpm start` for quiet output.
