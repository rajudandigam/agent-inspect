# Adoption starters

Blessed, deterministic starters for the v3 adoption path. **No API keys. No network.**

Full guide: [docs/ADOPTION.md](../../docs/ADOPTION.md)

| Starter | Command | Trace | Check |
| ------- | ------- | ----- | ----- |
| [custom-observe](./custom-observe/) | `pnpm start` | `npx agent-inspect list --dir .agent-inspect` | `npx agent-inspect check .agent-inspect/*.jsonl` |
| [ai-sdk](./ai-sdk/) | `pnpm start` | same | same |
| [openai-agents](./openai-agents/) | `pnpm start` | same | same |
| [langchain](./langchain/) | `pnpm start` | same | same |
| [ci-eval-redact](./ci-eval-redact/) | `pnpm start` | same | `npx agent-inspect redact --profile share` |
| [harness-nestjs](./harness-nestjs/) | `pnpm start` | `npx agent-inspect list --dir .agent-inspect` | same |
| [broken-agent-debugging](./broken-agent-debugging/) | `pnpm start` | `npx agent-inspect report <run-id>` | `redact --profile share` |
| VS Code (dev host) | F5 in `packages/vscode` | sidebar `list --json` | `doctor` command |

## Demo flow (broken → fixed)

1. Run a starter — capture a trace with an intentional or fixture failure
2. `npx agent-inspect view <run-id> --dir .agent-inspect` — find the failed step
3. `npx agent-inspect check … --detect-stalls` — optional CI rule demo
4. Fix the script, re-run, `npx agent-inspect diff` (if comparing runs)
5. `npx agent-inspect redact … --profile share` — share-safe artifact

See [docs/DEMO-SCRIPT.md](../../docs/DEMO-SCRIPT.md).

## Bootstrap a fresh project

```bash
npx agent-inspect init --framework ai-sdk --yes
npx agent-inspect doctor
```

## Run from monorepo

```bash
cd examples/starters/custom-observe && pnpm install && pnpm start
```

Requires `pnpm build` at repo root when using workspace packages.
