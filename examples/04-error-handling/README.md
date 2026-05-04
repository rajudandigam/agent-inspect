# Example 04 — Errors and traces

From the repo root, run `pnpm build` once before `pnpm install` in this folder.

Pricing flow: a step throws `Pricing API timeout`. `inspectRun` records the failure; the error is not swallowed inside `step` — we catch outside only to print a helpful CLI hint.

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
