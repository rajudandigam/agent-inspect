# Live demo script (~3 minutes)

**Audience:** TypeScript developers debugging AI agents.  
**Prereqs:** Node 20+, `pnpm build` at repo root (or `npm install agent-inspect` for consumers).

## Setup (before the call)

```bash
cd examples/starters/ai-sdk
pnpm install && pnpm start
```

Confirm a run exists: `npx agent-inspect list --dir .agent-inspect`

## Beat 1 — Problem (30s)

"Console logs are flat. When an agent calls three tools and an LLM in parallel, you can't see parent/child relationships or which step failed."

## Beat 2 — Capture (45s)

```bash
pnpm start                    # writes .agent-inspect/
npx agent-inspect list --dir .agent-inspect
```

Point out: run id, status, duration — **no upload**.

## Beat 3 — Inspect (45s)

```bash
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect timeline <run-id> --dir .agent-inspect
```

Optional: `npx agent-inspect serve --dir .agent-inspect` for browser viewer.

## Beat 4 — Verify (30s)

```bash
npx agent-inspect check .agent-inspect/<file>.jsonl --require-completed
```

Mention `--detect-stalls` and `--max-step-duration 30s` for long-running agents.

## Beat 5 — Share safely (30s)

```bash
npx agent-inspect redact .agent-inspect/<file>.jsonl --profile share
```

"Redacted copy is safe to attach to a GitHub issue."

## Beat 6 — Close (15s)

"Starters for AI SDK, OpenAI Agents, LangChain, CI, and NestJS harness are in `examples/starters/`. `agent-inspect init` bootstraps a fresh repo."

## Optional beats

- **VS Code:** F5 from `packages/vscode` (dev host) — Marketplace listing pending
- **Diff:** fix bug, re-run, `agent-inspect diff` before/after
- **Doctor:** `npx agent-inspect doctor` when onboarding fails
