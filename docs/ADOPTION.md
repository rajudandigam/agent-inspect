# Adoption guide

AgentInspect is **local-first**: traces stay on disk, checks run in CI, and sharing is opt-in via redaction. This guide is the blessed path from zero to a working team workflow.

**Website:** [https://agentinspect.vercel.app/](https://agentinspect.vercel.app/) · **Docs:** [https://agentinspect.vercel.app/docs/](https://agentinspect.vercel.app/docs/) · **Getting started:** [https://agentinspect.vercel.app/docs/getting-started/](https://agentinspect.vercel.app/docs/getting-started/)

## Who this is for

- TypeScript/Node teams shipping AI agents (not toy demos)
- Developers who want **structure** without a hosted observability account
- Maintainers who need **deterministic CI artifacts** (check, eval, redact)

## 5-minute path

See [FIRST-TRACE-IN-5-MINUTES.md](./FIRST-TRACE-IN-5-MINUTES.md) or the [docs site getting started](https://agentinspect.vercel.app/docs/getting-started/).

```bash
npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect verify-safe --dir .agent-inspect
```

No API keys required for the init demo. See [examples/starters/](../examples/starters/README.md).

## Choose a starter

| Goal | Starter |
| ---- | ------- |
| Manual `inspectRun` / `step` | [custom-observe](../examples/starters/custom-observe/) |
| Vercel AI SDK | [ai-sdk](../examples/starters/ai-sdk/) — see [AI-SDK-ADOPTION.md](./AI-SDK-ADOPTION.md) |
| OpenAI Agents JS | [openai-agents](../examples/starters/openai-agents/) — see [OPENAI-AGENTS-LOCAL.md](./OPENAI-AGENTS-LOCAL.md) |
| LangChain | [langchain](../examples/starters/langchain/) |
| CI eval + redact | [ci-eval-redact](../examples/starters/ci-eval-redact/) |
| Broken agent debug | [broken-agent-debugging](../examples/starters/broken-agent-debugging/) |
| NestJS harness | [harness-nestjs](../examples/starters/harness-nestjs/) — see [NESTJS.md](./NESTJS.md) |
| VS Code (dev host) | [VSCODE.md](./VSCODE.md) — extension in-repo; Marketplace publish is manual |

## Daily workflow

1. **Capture** — `observe()` / adapter / manual steps → `.agent-inspect/*.jsonl`
2. **Inspect** — `list`, `view`, `timeline`, `report`, optional `serve` viewer
3. **Verify** — `check`, `eval`, `@agent-inspect/circuit` rules in CI
4. **Share safely** — `redact --profile share` before attaching traces to issues/PRs
5. **Scale** — when directories grow, see [SCALE-LIMITS.md](./SCALE-LIMITS.md) and `agent-inspect index build`

## CI checklist

- Persist `.agent-inspect/` or upload as CI artifacts ([CI-ARTIFACTS.md](./CI-ARTIFACTS.md))
- Run `agent-inspect check` with `--require-completed` on fixture traces
- Run `agent-inspect eval` / `verify-safe` where applicable
- Never commit raw traces with secrets — use `redact` profiles

## When not to use AgentInspect alone

Use a production observability platform when you need hosted dashboards, fleet-wide sampling, or org-wide retention. AgentInspect complements that stack for the **inner loop**. See [COMPARE.md](./COMPARE.md).

## Presenting AgentInspect

- Live demo: [DEMO-SCRIPT.md](./DEMO-SCRIPT.md)
- Recorded walkthrough: [VIDEO-WALKTHROUGH-SCRIPT.md](./VIDEO-WALKTHROUGH-SCRIPT.md)
- Elevator pitch: [PITCH.md](./PITCH.md)
- Design partners: [DESIGN-PARTNER-GUIDE.md](./DESIGN-PARTNER-GUIDE.md)

## Measuring adoption (no default telemetry)

Track funnel metrics manually or from npm/GitHub public signals. See [product/ADOPTION-METRICS.md](./product/ADOPTION-METRICS.md).
