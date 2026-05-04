# Example 03 — Parallel sibling steps (`Promise.all`)

From the repo root, run `pnpm build` once before `pnpm install` in this folder.

Travel context collector runs three tool steps in parallel under one parent, then merges. The execution tree shows correct sibling isolation.

## Run

```bash
pnpm install
pnpm start
```

## Inspect

```bash
node packages/cli/dist/index.cjs list
node packages/cli/dist/index.cjs view <run-id>
```
