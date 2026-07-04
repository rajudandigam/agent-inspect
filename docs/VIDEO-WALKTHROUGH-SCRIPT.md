# Video walkthrough script (~5–7 minutes)

Use with [assets/demos/RECORDING.md](./assets/demos/RECORDING.md). Synthetic fixtures only — no API keys.

**Website:** [https://agentinspect.vercel.app/](https://agentinspect.vercel.app/) · **Docs:** [https://agentinspect.vercel.app/docs/](https://agentinspect.vercel.app/docs/)

## 0:00 — Hook

"AgentInspect turns TypeScript agent runs into local execution trees you can check in CI — without sending traces to the cloud."

## 0:30 — Install

```bash
npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
```

Show `.agent-inspect/` and `agent-inspect.config.ts`.

## 1:00 — Broken agent demo

Switch to [broken-agent-debugging starter](../examples/starters/broken-agent-debugging/):

```bash
cd examples/starters/broken-agent-debugging && pnpm install && pnpm start
npx agent-inspect report <run-id> --dir .agent-inspect
npx agent-inspect view <run-id> --dir .agent-inspect
```

B-roll: [error-handling.gif](./assets/demos/error-handling.gif) if not recording live.

## 2:00 — Framework path

Mention adapter package READMEs on npm. Quick cut to `examples/starters/ai-sdk` or [AI-SDK-ADOPTION.md](./AI-SDK-ADOPTION.md).

## 2:45 — Checks in CI

```bash
npx agent-inspect check .agent-inspect/*.jsonl --require-completed
npx agent-inspect eval <run-id> --dir .agent-inspect
```

Starter: [ci-eval-redact](../examples/starters/ci-eval-redact/)

## 3:30 — Redact before share

```bash
npx agent-inspect redact .agent-inspect/*.jsonl --profile share -o safe.jsonl
npx agent-inspect verify-safe safe.jsonl
```

## 4:00 — Fix and diff (optional)

```bash
pnpm run fixed   # in broken-agent-debugging starter
npx agent-inspect diff <before>.jsonl <after>.jsonl
```

## 4:30 — VS Code (optional)

"In v3.3 we added a read-only VS Code extension in the repo — develop with F5 from `packages/vscode`. Marketplace publish is a separate step."

## 5:00 — Boundaries

Not a hosted dashboard. Complements LangSmith/Langfuse/OTel. See [COMPARE.md](./COMPARE.md).

## 5:30 — CTA

"Pick a starter in `examples/starters/`, follow [FIRST-TRACE-IN-5-MINUTES.md](./FIRST-TRACE-IN-5-MINUTES.md), run `doctor` if stuck, open an issue with a redacted trace."

Related: [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) · [SCREENSHOTS.md](./SCREENSHOTS.md)
