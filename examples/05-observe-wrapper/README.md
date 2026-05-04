# Example 05 — `observe()` wrapper

## What `observe()` does (MVP)

Wraps **`run`**, **`execute`**, and **`invoke`** on an object or class instance so each call is traced as its own run (via `inspectRun` under the hood).

## What it does *not* do in MVP

It does **not** auto-instrument internal methods, private helpers, or framework hooks. You only get the **top-level** entry call as a run boundary.

## Why `step()` is still useful

Add **`step()`** inside your agent (as in `triage-question` here) to record substeps, LLM-shaped work, tools, etc., under that run.

## Run

```bash
pnpm build   # from repo root
pnpm install
pnpm start
```

Quiet: `AGENT_INSPECT_SILENT=true pnpm start`

## Inspect

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```
