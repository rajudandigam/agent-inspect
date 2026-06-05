# agent-inspect

**Local execution trees for TypeScript AI agents.**

agent-inspect helps you understand what happened inside an AI agent run — **locally**. It turns manual steps, tool calls, LLM calls, structured logs, failures, durations, and run metadata into **readable execution trees** you can inspect from the terminal.

It is built for TypeScript/Node.js developers and teams shipping real agentic products — not just toy demos. Use it **before** a hosted observability platform, **alongside** one, or as the **local debugging layer** underneath enterprise observability.

The tool starts with **manual traces** and **existing structured logs**, and extends into **optional framework callbacks** and **standards-aligned local export** — without turning the core into a SaaS or a vendor pipeline.

**No account. No cloud upload. No dashboard required.**

## Why agent-inspect exists

AI agents are no longer single function calls. They plan, call tools, invoke LLMs, branch, retry, fail, and run work in parallel. **Console logs are flat**; reconstructing causality from a wall of lines is slow and error-prone.

**Hosted observability** is valuable in production, but it can be heavy for the **inner loop**: local runs, fast iteration, and debugging before anything reaches a collector or dashboard.

agent-inspect gives those runs **structure**: an **execution tree** you can read and diff on disk, with a **CLI-first** workflow and **no vendor lock-in**.

## Install

```bash
npm install agent-inspect
```

```bash
pnpm add agent-inspect
```

Verify the CLI is available:

```bash
npx agent-inspect --help
```

## 60-second quickstart

Create `demo.mjs`:

```js
import { inspectRun, step } from "agent-inspect";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await inspectRun(
  "support-agent",
  async () => {
    const plan = await step("plan", async () => {
      await delay(40);
      return { intent: "refund-policy", needsPolicy: true };
    });

    const policy = await step.tool("retrieve-policy", async () => {
      await delay(60);
      return { text: "Refunds are available within 30 days of purchase." };
    });

    return step.llm("generate-answer", async () => {
      await delay(80);
      return `Policy: ${policy.text} (intent: ${plan.intent})`;
    });
  },
  { traceDir: "./.agent-inspect" }
);
```

Run it, then inspect the trace:

```bash
node demo.mjs
npx agent-inspect list --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect --summary
```

Full flow:

```bash
npm install agent-inspect
node demo.mjs
npx agent-inspect list --dir ./.agent-inspect
```

**Simplified example output** (actual CLI formatting may differ slightly):

```text
support-agent
✔ plan
✔ tool:retrieve-policy
✔ llm:generate-answer
```

A runnable copy lives in [examples/00-quickstart-demo](examples/00-quickstart-demo/README.md).

**Env-gated tracing** (eval harnesses, CI): use `maybeInspectRun` and set `AGENT_INSPECT=1` when you want a trace — otherwise no files are written.

```ts
import { maybeInspectRun } from "agent-inspect";

await maybeInspectRun("eval-case-42", async () => runAgent());
```

```bash
AGENT_INSPECT=1 node eval-runner.mjs
```

## What the trace shows

Each run produces a **JSONL** trace: `run_started` / `run_completed`, `step_started` / `step_completed`, with **nested steps**, **tool/LLM** types where you use `step.tool` / `step.llm`, and **durations** on completed steps. Failures are recorded on `step_completed` with `status: "error"` (there is no separate `step_failed` event). See [docs/SCHEMA.md](docs/SCHEMA.md).

## Works with structured logs you already have

Many production systems already emit **line-delimited JSON** or text logs with embedded JSON (e.g. via **pino**, **winston**, **log4js**, **NestJS** loggers, job runners, or custom event streams). agent-inspect can turn those into **local grouped timelines/trees** without wrapping every function.

```bash
npx agent-inspect logs ./agent.log \
  --format json \
  --run-id-key requestId \
  --event-key event \
  --timestamp-key timestamp
```

With a reusable ingest config:

```bash
npx agent-inspect logs ./agent.log --config agent-inspect.logs.json
```

- **JSON logs** are first-class.
- **log4js-style** lines are **best-effort** when a recoverable JSON payload is present.
- **No `eval`**, no JavaScript object-literal parsing as a log interchange format.
- **Flat timeline by default**; nesting when parent relationships are explicit or configured.
- **Confidence labels** (`explicit`, `correlated`, `heuristic`, `unknown`) describe how attribution was inferred.

More detail: [docs/LOGS.md](docs/LOGS.md) · [docs/LOG-TO-TREE-QUICKSTART.md](docs/LOG-TO-TREE-QUICKSTART.md).

## CLI at a glance

| Command | Use it for |
| -------- | ---------- |
| `list` | Find recent runs |
| `view` | Inspect one run as a tree |
| `clean` | Safely remove old trace files |
| `logs` | Turn existing structured logs into a local tree/timeline |
| `tail` | Watch structured logs while the app runs |
| `export` | Write Markdown / HTML / OpenInference-compatible JSON / OTLP JSON **locally** |
| `diff` | Compare two local runs (read-only) |

Full flags and behavior: [docs/CLI.md](docs/CLI.md).

## Real-world workflows

- Debug a **failed tool call** or thrown error in a support or ops agent.
- See **which step dominated latency** in a multi-step planner or RAG pipeline.
- **Diff two runs** after a prompt, model, or routing change.
- Point **`logs`** / **`tail`** at existing job or service logs to get a **local execution view** without shipping data upstream.
- **Export** a run to Markdown for a PR, postmortem, or internal thread — then review before sharing.
- Keep traces **on disk** while still using enterprise observability elsewhere.

## What v1.0 stabilizes

**agent-inspect 1.0** stabilizes the **local debugging foundation**:

- Instrument a run with `inspectRun` and `step`
- Write **local JSONL traces** (`schemaVersion: "0.1"` — compatibility retained)
- Inspect runs with **`list`** and **`view`**
- Safely remove old trace files with **`clean`**

**Stable APIs:** `inspectRun()`, `maybeInspectRun()`, `step()`, `step.llm()`, `step.tool()`, `observe()`.

Pass `enabled: false` to `inspectRun` for a no-trace passthrough. Use `maybeInspectRun` with `AGENT_INSPECT=1` (or `true` / `yes` / `on` / `enabled`) to toggle tracing in eval or CI jobs — see [docs/API.md](docs/API.md).

**Stable CLI workflows:** `agent-inspect list`, `agent-inspect view`, `agent-inspect clean`.

**Also included in 1.0** as local-first extensions:

- Structured log inspection: **`logs`**
- Live log tailing: **`tail`**
- Local exports: **`export`** (Markdown, HTML, OpenInference-compatible JSON, OTLP JSON — files only)
- Local run comparison: **`diff`**
- Optional **`@agent-inspect/langchain`** callback adapter
- Optional **`@agent-inspect/tui`** terminal viewer
- **Fixtures** and **recipes** for deterministic checks and adoption patterns

**Honest boundaries:** programmatic log parsing, export, and diff APIs; LangChain and TUI programmatic surfaces; and OpenInference/OTLP JSON exports are **experimental or compatibility-oriented**. Nothing performs **vendor upload** by default.

## Optional packages

### LangChain callback adapter (`@agent-inspect/langchain`)

Optional package: official **LangChain.js callbacks** (`BaseCallbackHandler`), **metadata-oriented by default**, **no monkey-patching**, **no vendor sink**. The LangChain adapter is available in 1.0, but its programmatic API remains experimental and may evolve independently of the stable core tracing API.

```bash
pnpm add agent-inspect @agent-inspect/langchain @langchain/core
```

```ts
import { AgentInspectCallback } from "@agent-inspect/langchain";

const callback = new AgentInspectCallback({
  runName: "my-run",
  capture: "metadata-only",
});

await agent.invoke(input, { callbacks: [callback] });
const events = callback.getEvents();
```

See [examples/08-langchain-adapter](examples/08-langchain-adapter/README.md) and [docs/ADAPTERS.md](docs/ADAPTERS.md).

### TUI viewer (`@agent-inspect/tui`)

Optional **Ink/React** package, installed separately. Use with an interactive terminal:

```bash
pnpm add agent-inspect @agent-inspect/tui
npx agent-inspect view <run-id> --tui
```

The TUI is available as a separate optional package; its programmatic API is experimental, while the CLI integration (`view --tui`) is the intended usage. Details: [docs/ADAPTERS.md](docs/ADAPTERS.md).

## Examples and recipes

| Example | Shows |
| ------- | ----- |
| [examples/00-quickstart-demo](examples/00-quickstart-demo/README.md) | Fast install-and-try trace |
| [examples/01-basic](examples/01-basic) | `inspectRun` + `step` |
| [examples/02-nested-steps](examples/02-nested-steps) | Nested tree |
| [examples/03-parallel-steps](examples/03-parallel-steps) | Parallel siblings |
| [examples/04-error-handling](examples/04-error-handling) | Failed steps |
| [examples/05-observe-wrapper](examples/05-observe-wrapper) | `observe()` |
| [examples/06-log-to-tree](examples/06-log-to-tree) | `logs` / `tail` |
| [examples/08-langchain-adapter](examples/08-langchain-adapter/README.md) | LangChain callbacks |
| [examples/recipes/rag-pipeline](examples/recipes/rag-pipeline) | RAG-shaped flow |
| [examples/recipes/tool-failure-retry](examples/recipes/tool-failure-retry) | Tool failure + retry |
| [examples/recipes/multi-agent-handoff](examples/recipes/multi-agent-handoff) | Handoff |
| [examples/recipes/proactive-agent-logs](examples/recipes/proactive-agent-logs) | Structured logs |
| [examples/recipes/retry-fallback](examples/recipes/retry-fallback) | Fallback pattern |
| [examples/recipes/parallel-tools](examples/recipes/parallel-tools) | Parallel tools |

**Recipes** are deterministic and require **no external services** by default. Index: [examples/README.md](examples/README.md), [examples/recipes/README.md](examples/recipes/README.md).

## Security and privacy posture

- **Local files by default** — no upload, no vendor sinks in core workflows.
- **No API keys** required for core tracing and CLI inspection.
- **Manual metadata** is user-controlled; traces and exports can contain sensitive data if you put it there.
- **Review exports** before sharing (especially with richer attribute flags).

See [SECURITY.md](SECURITY.md).

## agent-inspect comparison

It can **complement** LangSmith, Langfuse, Braintrust, Phoenix/OpenInference, OpenTelemetry, New Relic, Datadog, and similar platforms — but it does **not** replace their production or eval workflows.

For a detailed comparison, see [Compare with other tools](docs/COMPARE.md).

## Documentation

- [Getting started](docs/GETTING-STARTED.md)
- [API stability & experimental surfaces](docs/API.md)
- [CLI reference](docs/CLI.md)
- [Schema (`schemaVersion: "0.1"`)](docs/SCHEMA.md)
- [Architecture (links to deeper design notes)](docs/ARCHITECTURE.md)
- [Logs & tail](docs/LOGS.md)
- [Log-to-tree quickstart](docs/LOG-TO-TREE-QUICKSTART.md)
- [Exports](docs/EXPORTS.md)
- [Diff](docs/DIFF.md)
- [Adapters](docs/ADAPTERS.md)
- [Compare with other tools](docs/COMPARE.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [Known issues](docs/KNOWN-ISSUES.md)
- [Limitations](docs/LIMITATIONS.md)
- [Screenshot checklist (planned assets)](docs/SCREENSHOTS.md)

## Development

From a clone of this repo:

```bash
pnpm install
pnpm build
pnpm test
pnpm test:all
```

To run the CLI from source after a build: `node packages/cli/dist/index.cjs --help`.
