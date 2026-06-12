# Getting started

AgentInspect is a **local-first execution-tree debugger** for TypeScript AI agents. It helps you produce and inspect an execution tree of steps, safely and deterministically, without uploading data anywhere.

## 1. Install

```bash
pnpm add agent-inspect
```

The `agent-inspect` package includes the CLI binary via its `bin` field:

```bash
npx agent-inspect --help
```

For a clean install verification path covering npm, pnpm, ESM import, CJS require, and CLI help, see [Clean install smoke test](./INSTALL-SMOKE-TEST.md).

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

This writes a local JSONL trace with stable event names (`schemaVersion: "0.1"`):

- `run_started`, `run_completed`
- `step_started`, `step_completed`

### Always trace vs env-gated tracing

Use **`inspectRun`** when you always want a local trace (default behavior).

Use **`maybeInspectRun`** in eval harnesses, CI, or production-shaped jobs where tracing should be toggled by environment:

```ts
import { maybeInspectRun } from "agent-inspect";

await maybeInspectRun("eval-case-42", async () => {
  return runAgent();
});
```

```bash
AGENT_INSPECT=1 node eval-runner.mjs
```

Enable tokens: `1`, `true`, `yes`, `on`, `enabled` (case-insensitive). Explicit `enabled: true | false` in options overrides the env var.

### Correlation metadata (v1.3.0+)

Attach optional correlation fields to `run_started` metadata — useful for eval cases, CI job IDs, and future stats views. They are **metadata only**, not run IDs. Review before sharing exports.

```ts
await inspectRun(
  "support-agent",
  async () => runAgent(),
  {
    correlationId: "eval-suite-2026-06",
    requestId: "req-abc123",
    groupId: "ci-job-42",
  }
);
```

Inside a traced run, adapters can read active fields via `getCurrentCorrelationMetadata()`.

### Install compatibility

If `import` or `require` fails after install, see [KNOWN-ISSUES.md — Common install/runtime compatibility checks](./KNOWN-ISSUES.md#common-installruntime-compatibility-checks).

To skip tracing in code without env vars: `inspectRun(name, fn, { enabled: false })`.

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

Share-safe copy for a PR or issue (v1.3.0+):

```bash
agent-inspect export minimal-success --dir fixtures/traces \
  --format markdown --redaction-profile share
```

Exports are **local-only** and do not upload anywhere. Review output before sharing — see [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md).

## 8. Local observability (v1.4.0+)

After traces exist under a directory:

```bash
agent-inspect timeline <run-id> --dir ./.agent-inspect
agent-inspect stats --dir ./.agent-inspect --since 7d
agent-inspect search --dir ./.agent-inspect --status error --limit 10
```

For CI artifact workflows, see [CI-ARTIFACTS.md](./CI-ARTIFACTS.md) and [github-actions-artifact recipe](../examples/recipes/github-actions-artifact/).

## 9. Diff two runs

```bash
agent-inspect diff minimal-success minimal-error --dir fixtures/traces
```

## 9. Try recipes

See `examples/recipes/README.md`.

## 10. Optional LangChain adapter

`@agent-inspect/langchain` is optional and **experimental**. Events are **in-memory by default**; pass `persist: true` to write local JSONL traces inspectable by the CLI.

```bash
pnpm add @agent-inspect/langchain
```

See [examples/08-langchain-adapter](../examples/08-langchain-adapter/README.md) and [docs/ADAPTERS.md](./ADAPTERS.md).

## 11. Optional TUI

`@agent-inspect/tui` is optional and **experimental**. The CLI can invoke it with:

```bash
agent-inspect view <runId> --tui
```

## 12. Safety notes

- Redaction is on by default for log-derived attributes, **manual trace metadata (before disk)**, and exports. Pass `redact: false` to opt out of manual metadata redaction.
- Persisted events are size-bounded by default (see `docs/API.md`).
- Confidence labels are required to keep attribution honest.
- AgentInspect is for local debugging, not production monitoring.

## 13. Next docs

- [docs/API.md](./API.md)
- [docs/CLI.md](./CLI.md)
- [docs/SCHEMA.md](./SCHEMA.md)
- [docs/EXPORTS.md](./EXPORTS.md)
- [docs/SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md)
- [docs/ADAPTERS.md](./ADAPTERS.md)
- [docs/LOGGING-PLAYBOOK.md](./LOGGING-PLAYBOOK.md)
- [docs/COMPARE.md](./COMPARE.md)
- [docs/LOG-TO-TREE-QUICKSTART.md](./LOG-TO-TREE-QUICKSTART.md)
- [docs/KNOWN-ISSUES.md](./KNOWN-ISSUES.md)
- [docs/LIMITATIONS.md](./LIMITATIONS.md)
- [ROADMAP.md](../ROADMAP.md)
