# agent-inspect

**Local execution trees for TypeScript AI agents.**

agent-inspect helps you understand what happened inside an AI agent run — **locally**. It turns manual steps, tool calls, LLM calls, structured logs, failures, durations, and run metadata into **readable execution trees** you can inspect from the terminal.

It is built for TypeScript/Node.js developers and teams shipping real agentic products — not just toy demos. Use it for **local TypeScript agent debugging**, **eval iteration**, and **CI trace artifacts**. It **complements** production observability platforms; it does **not** replace them.

The tool starts with **manual traces** and **existing structured logs**, and extends into **optional framework callbacks** and **standards-aligned local export** — without turning the core into a SaaS or a vendor pipeline.

**No account. No cloud upload. No dashboard required.**

**Visual demos:** [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) — curated terminal recordings (synthetic fixtures only).

## Why agent-inspect exists

AI agents are no longer single function calls. They plan, call tools, invoke LLMs, branch, retry, fail, and run work in parallel. **Console logs are flat**; reconstructing causality from a wall of lines is slow and error-prone.

**Hosted observability** is valuable in production, but it can be heavy for the **inner loop**: local runs, fast iteration, and debugging before anything reaches a collector or dashboard.

agent-inspect gives those runs **structure**: an **execution tree** you can read and diff on disk, with a **CLI-first** workflow and **no vendor lock-in**.

## Install

Current npm release: **1.5.0** (`agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui` — all aligned).

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

For a clean npm/pnpm install checklist with ESM, CJS, and CLI checks, see [Clean install smoke test](docs/INSTALL-SMOKE-TEST.md).

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

## What you can do today (v1.5.0)

- **Trace manually** with `inspectRun`, `step`, `step.llm`, `step.tool`, and `observe` — local JSONL under `.agent-inspect/` by default.
- **Toggle tracing** with `maybeInspectRun` and `AGENT_INSPECT=1` in eval harnesses or CI.
- **Correlate runs** with optional `correlationId`, `requestId`, `decisionId`, and `groupId` on `run_started` metadata.
- **Redact before disk** with default key-based redaction, or choose `redactionProfile`: `local`, `share`, or `strict`.
- **Inspect from the CLI** — `list`, `view`, `clean`, `logs`, `tail`, `export`, `diff`, `timeline`, `stats`, `search`, `what`, `report`.
- **Export share-safe copies** — `export --redaction-profile share` (or `strict`) writes local Markdown/HTML/OpenInference/OTLP JSON only.
- **Parse structured logs** you already emit (JSON first-class; log4js best-effort).
- **Optional LangChain adapter** — metadata-only by default; optional `persist: true` and `stream: true` streaming metadata (no full token capture by default).
- **Optional TUI** — `view --tui` when `@agent-inspect/tui` is installed.
- **Persisted-event foundation (v1.2.0+)** — in-memory `PersistedInspectEvent` converters; manual writing stays `schemaVersion: "0.1"`.

Nothing uploads traces by default. Review exports before sharing — see [safe trace sharing](docs/SAFE-TRACE-SHARING.md).

## What the trace shows

Each run produces a **JSONL** trace: `run_started` / `run_completed`, `step_started` / `step_completed`, with **nested steps**, **tool/LLM** types where you use `step.tool` / `step.llm`, and **durations** on completed steps. Failures are recorded on `step_completed` with `status: "error"` (there is no separate `step_failed` event). See [docs/SCHEMA.md](docs/SCHEMA.md).

![Nested execution tree from a local JSONL trace](https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/demos/execution-tree.gif)

*Synthetic demo — [examples/02-nested-steps](examples/02-nested-steps/README.md). More visuals: [SCREENSHOTS.md](docs/SCREENSHOTS.md).*

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

**Visual:** JSON log → tree recording is [documented in SCREENSHOTS.md](docs/SCREENSHOTS.md#json-logs--tree) (re-record pending; command above is the canonical flow).

More detail: [docs/LOGS.md](docs/LOGS.md) · [docs/LOG-TO-TREE-QUICKSTART.md](docs/LOG-TO-TREE-QUICKSTART.md) · [docs/LOGGING-PLAYBOOK.md](docs/LOGGING-PLAYBOOK.md) (pino, log4js, NestJS).

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
| `timeline` | Chronological view of one run |
| `stats` | Local aggregates over a trace directory |
| `search` | Deterministic search over local traces |
| `what` | Concise summary of one run |
| `report` | Markdown/HTML inspection report (what + timeline + tree) |

![Timeline with slow-step focus for one run](https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/demos/timeline.gif)

*Synthetic demo — `agent-inspect timeline` on [fixtures/traces](fixtures/traces). Gallery: [SCREENSHOTS.md](docs/SCREENSHOTS.md).*

Full flags and behavior: [docs/CLI.md](docs/CLI.md).

## Real-world workflows

- Debug a **failed tool call** or thrown error in a support or ops agent.
- See **which step dominated latency** in a multi-step planner or RAG pipeline.
- **Diff two runs** after a prompt, model, or routing change (see [diff examples](docs/DIFF.md)).
- Point **`logs`** / **`tail`** at existing job or service logs to get a **local execution view** without shipping data upstream.
- **Export** a run to Markdown for a PR, postmortem, or internal thread — use `--redaction-profile share` for share-safe copies, then review before sharing.
- Keep traces **on disk** while still using enterprise observability elsewhere.

## Stable foundation (AgentInspect 1.x)

**agent-inspect 1.x** (current: **1.5.0**) is the **local-first trace workbench** for TypeScript AI agents:

- Instrument runs with `inspectRun` and `step`
- Write **local JSONL traces** (`schemaVersion: "0.1"` — compatibility retained)
- Inspect with **`list`**, **`view`**, **`clean`**, **`logs`**, **`tail`**, **`export`**, **`diff`**, **`timeline`**, **`stats`**, **`search`**

**Stable APIs:** `inspectRun()`, `maybeInspectRun()`, `step()`, `step.llm()`, `step.tool()`, `observe()`, `getCurrentCorrelationMetadata()`.

Pass `enabled: false` to `inspectRun` for a no-trace passthrough. Use `maybeInspectRun` with `AGENT_INSPECT=1` to toggle tracing in eval or CI — see [docs/API.md](docs/API.md).

**Shipped in 1.5.0:** non-breaking subpath exports; `what` and `report` CLI; dual-format read path (v0.1 + v0.2 JSONL); [what-report-inspect recipe](examples/recipes/what-report-inspect/). Linked release aligns all three npm packages at **1.5.0**.

**Planning after 1.5.0:** v1.6 focuses on runtime foundation and universal local trace ingestion before new framework adapters. See [ROADMAP.md](ROADMAP.md).

**Shipped in 1.4.0:** CI artifact recipe ([docs/CI-ARTIFACTS.md](docs/CI-ARTIFACTS.md)); `timeline`, `stats`, and `search` CLI; core helpers `buildRunTimeline`, `buildTraceStats`, `searchTraces`. Linked release aligns all three npm packages at **1.4.0**.

**Shipped in 1.3.0:** correlation metadata; redaction profiles (`local` / `share` / `strict`); `export --redaction-profile`; LangChain `stream: true` metadata (chunk counts, duration — no full token capture by default).

**Also in 1.x** (local-first extensions):

- **v1.2.0** — experimental persisted-event foundation (`PersistedInspectEvent`, converters, in-memory tree bridge). Manual writing remains **`schemaVersion: "0.1"`**; v0.2 is **not written by default**.
- Optional **`@agent-inspect/langchain`** and **`@agent-inspect/tui`**
- **Fixtures** and **recipes** for deterministic adoption patterns

**Honest boundaries:** log parsing, export, diff, LangChain/TUI programmatic APIs, and OpenInference/OTLP JSON exports are **experimental or compatibility-oriented**. Nothing performs **vendor upload** by default.

## Optional packages

### LangChain callback adapter (`@agent-inspect/langchain`)

Optional package: official **LangChain.js callbacks** (`BaseCallbackHandler`), **metadata-oriented by default**, **no monkey-patching**, **no vendor sink**. Optional **`stream: true`** records chunk counts and stream duration **without storing full token text by default**. The LangChain adapter ships with 1.x; its programmatic API remains experimental and may evolve independently of the stable core tracing API.

```bash
pnpm add agent-inspect @agent-inspect/langchain @langchain/core
```

```ts
import { AgentInspectCallback } from "@agent-inspect/langchain";

const callback = new AgentInspectCallback({
  runName: "support-agent",
  traceDir: "./.agent-inspect",
  persist: true,
  capture: "metadata-only",
});

await agent.invoke(input, { callbacks: [callback] });
// In-memory events still available:
const events = callback.getEvents();
// Persisted runs are inspectable via CLI:
// npx agent-inspect list --dir ./.agent-inspect
// npx agent-inspect view <run-id> --dir ./.agent-inspect
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
| [examples/recipes/pino-json-logs](examples/recipes/pino-json-logs) | pino-shaped JSON |
| [examples/recipes/log4js-json-layout](examples/recipes/log4js-json-layout) | log4js embedded JSON |
| [examples/recipes/nestjs-json-logging](examples/recipes/nestjs-json-logging) | NestJS JSON logs |
| [examples/recipes/retry-fallback](examples/recipes/retry-fallback) | Fallback pattern |
| [examples/recipes/parallel-tools](examples/recipes/parallel-tools) | Parallel tools |
| [examples/recipes/github-actions-artifact](examples/recipes/github-actions-artifact) | CI trace artifacts |

**Recipes** are deterministic and require **no external services** by default. Index: [examples/README.md](examples/README.md), [examples/recipes/README.md](examples/recipes/README.md).

## Security and privacy posture

- **Local files by default** — no upload, no vendor sinks in core workflows.
- **No API keys** required for core tracing and CLI inspection.
- **Manual metadata** is user-controlled. By default, common sensitive keys are **redacted before disk**; pass `redact: false` to opt out. Long metadata is truncated and events are capped at 64 KiB per JSONL line. Review traces and exports before sharing.
- **Review exports** before sharing (especially with richer attribute flags).

See [SECURITY.md](SECURITY.md) and the [safe trace sharing checklist](docs/SAFE-TRACE-SHARING.md).

## agent-inspect comparison

It can **complement** LangSmith, Langfuse, Braintrust, Phoenix/OpenInference, OpenTelemetry, New Relic, Datadog, and similar platforms — but it does **not** replace their production or eval workflows.

For a detailed comparison, see [Compare with other tools](docs/COMPARE.md).

## Documentation

| Start here | Reference | Safety & boundaries |
| ---------- | --------- | ------------------- |
| [Getting started](docs/GETTING-STARTED.md) | [API](docs/API.md) | [Safe trace sharing](docs/SAFE-TRACE-SHARING.md) |
| [Install smoke test](docs/INSTALL-SMOKE-TEST.md) | [CLI](docs/CLI.md) | [Security](SECURITY.md) |
| [Log-to-tree quickstart](docs/LOG-TO-TREE-QUICKSTART.md) | [Schema](docs/SCHEMA.md) | [Limitations](docs/LIMITATIONS.md) |
| [Logging playbook](docs/LOGGING-PLAYBOOK.md) | [Exports](docs/EXPORTS.md) | [Known issues](docs/KNOWN-ISSUES.md) |
| [CI artifacts](docs/CI-ARTIFACTS.md) | [Adapters](docs/ADAPTERS.md) | [Compare with other tools](docs/COMPARE.md) |
| [Visual demos](docs/SCREENSHOTS.md) | [Examples](examples/README.md) | |

Also: [Architecture](docs/ARCHITECTURE.md) · [Logs & tail](docs/LOGS.md) · [Diff](docs/DIFF.md) · [Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md) · [Contributing](CONTRIBUTING.md) · [Good first issues](GOOD-FIRST-ISSUES.md)

## Contributing

AgentInspect welcomes docs, fixtures, examples, and carefully scoped CLI improvements.

- **Good first issues:** [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md) — live batches [#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen) and [#18–#30](https://github.com/rajudandigam/agent-inspect/issues/18) (comment on an issue before opening a PR)
- **Discussions:** [github.com/rajudandigam/agent-inspect/discussions](https://github.com/rajudandigam/agent-inspect/discussions) — feedback, stack survey, integration ideas
- **Roadmap:** [ROADMAP.md](ROADMAP.md) — Now / Next / Future direction (non-committal)
- **Contributing guide:** [CONTRIBUTING.md](CONTRIBUTING.md) — validation commands, PR expectations, scope boundaries

**Security:** Traces and logs may contain secrets. **Redact before sharing** in issues, Discussions, PRs, or exports. See [SECURITY.md](SECURITY.md) and the [safe trace sharing checklist](docs/SAFE-TRACE-SHARING.md).

## Development

From a clone of this repo:

```bash
pnpm install
pnpm build
pnpm test
pnpm test:all
```

To run the CLI from source after a build: `node packages/cli/dist/index.cjs --help`.
