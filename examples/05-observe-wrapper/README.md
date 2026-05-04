# Example 05 — `observe()` agent wrapper

From the repo root, run `pnpm build` once before `pnpm install` in this folder.

`CustomerSupportAgent.run` is wrapped so each invocation becomes a traced run. Internal `step()` calls still appear in the tree under that run.

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
