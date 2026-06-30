# Adoption starters

Blessed, deterministic starters for the v3.1 adoption path. **No API keys. No network.**

| Starter | Command | Trace | Check |
| ------- | ------- | ----- | ----- |
| [custom-observe](./custom-observe/) | `pnpm start` | `npx agent-inspect list --dir .agent-inspect` | `npx agent-inspect check .agent-inspect/*.jsonl` |
| [ai-sdk](./ai-sdk/) | `pnpm start` | same | same |
| [openai-agents](./openai-agents/) | `pnpm start` | same | same |
| [langchain](./langchain/) | `pnpm start` | same | same |
| [ci-eval-redact](./ci-eval-redact/) | `pnpm start` | same | `npx agent-inspect redact --profile share` |
| [harness-nestjs](./harness-nestjs/) | `pnpm start` | `npx agent-inspect list --dir .agent-inspect` | same |

Run from repo root after `pnpm build`:

```bash
cd examples/starters/custom-observe && pnpm install && pnpm start
```

Or bootstrap a fresh project with:

```bash
npx agent-inspect init --framework custom
```
