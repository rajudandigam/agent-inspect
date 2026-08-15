# Adoption starters

Blessed, deterministic starters for the **6.12** local evidence loop. **No API keys. No network.**

Full guide: [docs/ADOPTION.md](../../docs/ADOPTION.md) · Positioning: [docs/POSITIONING-AND-PORTFOLIO.md](../../docs/POSITIONING-AND-PORTFOLIO.md)

| Starter | Unique-value beat | After `pnpm start` |
| ------- | ----------------- | ------------------ |
| [broken-agent-debugging](./broken-agent-debugging/) | Debug / Prevent / Share: good, regression, and synthetic PII | `demo-good` / `demo-regression` / `demo-pii` then `check` / `bundle` / `verify-safe` |
| [coding-agent-debug-loop](./coding-agent-debug-loop/) | MCP inspect + Evidence v2 | `pnpm run inspect-mcp` · `mcp configure --client cursor` |
| [ci-eval-redact](./ci-eval-redact/) | CI check + share-checked artifact | `check <run-id>` · `redact <run-id> --profile share` |
| [custom-observe](./custom-observe/) | Manual `inspectRun` / `step` | `list` · `check <run-id>` |
| [ai-sdk](./ai-sdk/) | Vercel AI SDK adapter | same |
| [openai-agents](./openai-agents/) | OpenAI Agents adapter | same |
| [langchain](./langchain/) | LangChain / LangGraph-via-LangChain | same |
| [harness-nestjs](./harness-nestjs/) | Fixture harness path | same |

## Demo flow (broken → fixed → share-checked)

1. `cd examples/starters/broken-agent-debugging && pnpm install && pnpm start`
2. `npx agent-inspect list --dir .agent-inspect` — copy `<run-id>`
3. `npx agent-inspect report <run-id> --dir .agent-inspect` — find causal failure
4. `npx agent-inspect check <run-id> --dir .agent-inspect`
5. Fix (`pnpm run fixed`), optionally `diff`
6. `npx agent-inspect redact <run-id> --dir .agent-inspect --profile share -o safe.jsonl`
7. `npx agent-inspect verify-safe <run-id> --dir .agent-inspect`
8. Optional: `npx agent-inspect bundle <run-id> --dir .agent-inspect --profile share` then `bundle verify`

MCP path: [coding-agent-debug-loop](./coding-agent-debug-loop/) · [docs/CODING-AGENT-LOOP.md](../../docs/CODING-AGENT-LOOP.md)

See [docs/DEMO-SCRIPT.md](../../docs/DEMO-SCRIPT.md).

## Bootstrap a fresh project

```bash
npx agent-inspect init --framework ai-sdk --yes
npx agent-inspect doctor
```

## Run from monorepo

```bash
cd examples/starters/broken-agent-debugging && pnpm install && pnpm start
```

Requires `pnpm build` at repo root when using workspace packages.
