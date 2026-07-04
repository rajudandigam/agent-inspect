# First trace in 5 minutes

Goal: install → one trace → one check → one share-safe artifact.

**Docs site:** [https://agentinspect.vercel.app/docs/getting-started/](https://agentinspect.vercel.app/docs/getting-started/)

```bash
npm install agent-inspect && npx agent-inspect init --yes && node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect && npx agent-inspect report <run-id> --dir .agent-inspect
npx agent-inspect check .agent-inspect/*.jsonl && npx agent-inspect verify-safe --dir .agent-inspect
```

## Minutes 0–1: Install

```bash
mkdir my-agent-debug && cd my-agent-debug
npm install agent-inspect
npx agent-inspect init --yes
```

Creates `agent-inspect.config.ts`, `.agent-inspect/`, and `examples/agent-inspect-demo.mjs`.

## Minutes 1–2: Run

```bash
node examples/agent-inspect-demo.mjs
```

No API keys. Deterministic local trace.

## Minutes 2–3: Inspect

```bash
npx agent-inspect list --dir .agent-inspect
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect report <run-id> --dir .agent-inspect
```

## Minutes 3–4: Check

```bash
npx agent-inspect check .agent-inspect/*.jsonl
```

## Minutes 4–5: Share-safe artifact

```bash
npx agent-inspect redact --profile share --dir .agent-inspect
npx agent-inspect verify-safe --dir .agent-inspect
```

Attach redacted JSONL to a PR or issue — not raw traces.

## Next steps

| If you use… | Go to |
| ----------- | ----- |
| AI SDK | [AI SDK adoption](./AI-SDK-ADOPTION.md) |
| OpenAI Agents | [OpenAI Agents local](./OPENAI-AGENTS-LOCAL.md) |
| LangChain | [Adapters](./ADAPTERS.md) |
| CI tests | [CI artifacts](./CI-ARTIFACTS.md) |
| Broken agent demo | [broken-agent-debugging starter](../examples/starters/broken-agent-debugging/README.md) |

Full index: [docs/README.md](./README.md) · Website docs: [agentinspect.vercel.app/docs](https://agentinspect.vercel.app/docs/)
