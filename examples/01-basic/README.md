# Example 01 — Basic `inspectRun` + `step`

From the **repository root**, run `pnpm build` once so `agent-inspect` resolves to built `dist/` files.

Hotel booking flow: search hotels, check availability, finalize. Each `step()` is a durable node in the JSONL trace (better than scattered logs).

## Run

```bash
pnpm install
pnpm start
```

## Inspect traces

From the **repository root** (after `pnpm build`):

```bash
node packages/cli/dist/index.cjs list
node packages/cli/dist/index.cjs view <run-id>
```

Or with a linked / installed CLI:

```bash
npx agent-inspect list
npx agent-inspect view <run-id>
```

From the monorepo you can also use the workspace CLI:

```bash
pnpm --filter @agent-inspect/cli exec agent-inspect list
```
