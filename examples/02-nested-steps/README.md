# Example 02 — Nested steps (`step`, `step.llm`, `step.tool`)

From the repo root, run `pnpm build` once before `pnpm install` in this folder.

Trip planner scenario: a parent `plan-trip` step contains nested LLM, parsing, tool, and finalize steps. The trace shows the tree structure.

## Run

```bash
pnpm install
pnpm start
```

## Inspect

From repo root after `pnpm build`:

```bash
node packages/cli/dist/index.cjs list
node packages/cli/dist/index.cjs view <run-id>
```
