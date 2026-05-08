# Getting started (v1.0 stabilization — Pass 1)

AgentInspect is a **local-first execution-tree debugger** for TypeScript AI agents. It helps you produce and inspect an execution tree of steps, safely and deterministically, without uploading data anywhere.

## 1. Install

```bash
pnpm add agent-inspect
```

The `agent-inspect` package includes the CLI binary via its `bin` field:

```bash
npx agent-inspect --help
```

For local repo development (this monorepo), build and run the CLI from `packages/cli`:

```bash
pnpm build
node packages/cli/dist/index.cjs --help
```

## 2. Basic manual trace

```ts
import { inspectRun, step } from "agent-inspect";

await inspectRun("demo-agent", async () => {
  await step("plan", async () => "ok");
  await step.tool("search", async () => ({ count: 2 }));
  await step.llm("fixture-model", async () => "done");
});
```

This writes a local JSONL trace with stable v1.0 event names:

- `run_started`, `run_completed`
- `step_started`, `step_completed`

## 3. View runs

```bash
agent-inspect list
agent-inspect view <runId>
```

## 4. Clean old runs (safely)

Always start with `--dry-run`:

```bash
agent-inspect clean --older-than 7d --dry-run
agent-inspect clean --older-than 7d --yes
```

## 5. Parse existing logs

```bash
agent-inspect logs fixtures/logs/proactive-json.log \
  --format json \
  --config fixtures/configs/proactive-agent-inspect.logs.json
```

## 6. Tail logs

For scripting/CI-style usage, `--once` reads and exits:

```bash
agent-inspect tail \
  --file fixtures/logs/proactive-json.log \
  --format json \
  --config fixtures/configs/proactive-agent-inspect.logs.json \
  --once
```

## 7. Export a run

```bash
agent-inspect export minimal-success --dir fixtures/traces --format markdown
agent-inspect export minimal-success --dir fixtures/traces --format openinference --validate
```

Exports are **local-only** and do not upload anywhere.

## 8. Diff two runs

```bash
agent-inspect diff minimal-success minimal-error --dir fixtures/traces
```

## 9. Try recipes

See `examples/recipes/README.md`.

## 10. Optional LangChain adapter

`@agent-inspect/langchain` is optional and **experimental**:

```bash
pnpm add @agent-inspect/langchain
```

## 11. Optional TUI

`@agent-inspect/tui` is optional and **experimental**. The CLI can invoke it with:

```bash
agent-inspect view <runId> --tui
```

## 12. Safety notes

- Redaction is on by default for log-derived attributes and exports.
- Confidence labels are required to keep attribution honest.
- AgentInspect is for local debugging, not production monitoring.

## 13. Next docs

- `docs/API.md`
- `docs/CLI.md`
- `docs/SCHEMA.md`
- `docs/KNOWN-ISSUES.md`
- `docs/LIMITATIONS.md`
- `docs/V1-READINESS-CHECKLIST.md`

