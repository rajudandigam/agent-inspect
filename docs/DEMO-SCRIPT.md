# Live demo script (~3 minutes)

**Audience:** TypeScript developers debugging AI agents.  
**Prereqs:** Node 20+. Consumers: `npm install agent-inspect`. Monorepo: `pnpm build` at repo root.

**Blessed demo starter:** [broken-agent-debugging](../examples/starters/broken-agent-debugging/) — intentional tool failure, no API keys.

## Setup (before the call)

```bash
cd examples/starters/broken-agent-debugging
pnpm install && pnpm start
npx agent-inspect list --dir .agent-inspect
```

Copy a `<run-id>` for beats below.

## Beat 1 — Problem (30s)

"Console logs are flat. When an agent picks the wrong tool or a step throws, you can't see parent/child relationships or which step failed first."

## Beat 2 — Capture (45s)

```bash
pnpm start                    # writes failing trace to .agent-inspect/
npx agent-inspect list --dir .agent-inspect
```

Point out: run id, status, duration — **no upload**, metadata-only by default.

## Beat 3 — Inspect (45s)

```bash
npx agent-inspect report <run-id> --dir .agent-inspect
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect timeline <run-id> --dir .agent-inspect
```

Optional: `npx agent-inspect serve --dir .agent-inspect` for browser viewer.

## Beat 4 — Verify (30s)

```bash
npx agent-inspect check .agent-inspect/*.jsonl --require-completed
```

Mention `--detect-stalls` and `--max-step-duration 30s` for long-running agents.

## Beat 5 — Share safely (30s)

```bash
npx agent-inspect redact .agent-inspect/*.jsonl --profile share -o safe.jsonl
npx agent-inspect verify-safe safe.jsonl
```

"Redacted copy is safe to attach to a GitHub issue or Slack."

## Beat 6 — Fix and diff (optional, 30s)

```bash
pnpm run fixed
npx agent-inspect diff .agent-inspect/<broken-run>.jsonl .agent-inspect/<fixed-run>.jsonl
```

## Beat 7 — Close (15s)

"Starters for AI SDK, OpenAI Agents, LangChain, CI, and NestJS harness are in `examples/starters/`. Fresh repos: `npx agent-inspect init --yes`."

## Alternative opener (zero clone)

```bash
npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
```

See [FIRST-TRACE-IN-5-MINUTES.md](./FIRST-TRACE-IN-5-MINUTES.md).

## Optional beats

- **VS Code:** F5 from `packages/vscode` (dev host) — Marketplace listing pending
- **Doctor:** `npx agent-inspect doctor` when onboarding fails
- **Framework:** switch to `examples/starters/ai-sdk` for adapter path

Related: [VIDEO-WALKTHROUGH-SCRIPT.md](./VIDEO-WALKTHROUGH-SCRIPT.md) · [SCREENSHOTS.md](./SCREENSHOTS.md)
