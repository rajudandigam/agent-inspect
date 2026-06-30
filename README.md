# agent-inspect

**Trace, check, and safely share TypeScript AI agent runs locally.**

agent-inspect helps you understand what happened inside an AI agent run without sending traces to a hosted service. It turns framework events, observed objects/classes, manual steps, tool calls, LLM calls, structured logs, failures, durations, and run metadata into readable local execution trees.

It is built for TypeScript/Node.js developers and teams shipping real agentic products — not just toy demos. Use it for **local TypeScript agent debugging**, **eval iteration**, and **CI trace artifacts**. It **complements** production observability platforms; it does **not** replace them.

The default loop is local-first: capture a trace, inspect/report/diff it, run deterministic checks in CI, then export a redacted copy only when you choose to share.

**No account. No cloud upload. No dashboard required.**

**Visual demos:** [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) — curated terminal recordings (synthetic fixtures only).

## Why agent-inspect exists

AI agents are no longer single function calls. They plan, call tools, invoke LLMs, branch, retry, fail, and run work in parallel. **Console logs are flat**; reconstructing causality from a wall of lines is slow and error-prone.

**Hosted observability** is valuable in production, but it can be heavy for the **inner loop**: local runs, fast iteration, and debugging before anything reaches a collector or dashboard.

agent-inspect gives those runs **structure**: an **execution tree** you can read and diff on disk, with a **CLI-first** workflow and **no vendor lock-in**.

## Install

Current npm release line: **3.3.0** for the linked public packages (`agent-inspect`, adapters, reporters, redact, eval, mcp, guardrails, circuit, viewer, mcp-server, adapter-sdk, harness). **v3.0.0** adds extension contracts and **`@agent-inspect/adapter-sdk`** for third-party adapter authoring; persisted trace schema remains **1.0**.

**v3.1 adoption path (in progress):**

1. `npx agent-inspect init` — local config + demo (no auto-install)
2. `observe()` or a framework adapter
3. `@agent-inspect/harness` for real project runners
4. `npx agent-inspect doctor` when setup fails
5. `check` / `eval` / `redact` / `report` for CI and safe sharing

See [examples/starters/](examples/starters/README.md) and [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md).

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

## Three adoption paths

Already using AI SDK, OpenAI Agents JS, LangChain, or LangGraph-through-LangChain? Start with **Path B** for framework-native local traces before adding manual instrumentation.

### Path A — Observe an existing object/class

Use `observe()` when you already have an agent-like object with a `run`, `execute`, or `invoke` method.

Create `demo.mjs`:

```js
import { observe } from "agent-inspect";

class SupportAgent {
  async run(input) {
    return {
      answer: `Answering: ${input.question}`,
    };
  }
}

const agent = observe(new SupportAgent(), {
  traceDir: "./.agent-inspect",
});

await agent.run({
  question: "How do refunds work?",
});
```

Run it, then inspect the trace:

```bash
node demo.mjs
npx agent-inspect list --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect
```

### Path B — Use a framework adapter

Optional adapters keep framework dependencies out of the root package and write local traces only when configured.

AI SDK local telemetry:

```ts
import { generateText } from "ai";
import { agentInspect } from "@agent-inspect/ai-sdk";

await generateText({
  model,
  prompt,
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        traceDir: "./.agent-inspect",
        runName: "support-agent",
        capture: "metadata-only",
      }),
    ],
  },
});
```

OpenAI Agents local-only processor:

```ts
import { setTraceProcessors } from "@openai/agents";
import { agentInspectProcessor } from "@agent-inspect/openai-agents";

setTraceProcessors([
  agentInspectProcessor({
    traceDir: "./.agent-inspect",
    workflowName: "support-agent",
    capture: "metadata-only",
  }),
]);
```

LangChain callback adapter:

```ts
import { AgentInspectCallback } from "@agent-inspect/langchain";

const callback = new AgentInspectCallback({
  runName: "support-agent",
  traceDir: "./.agent-inspect",
  persist: true,
  capture: "metadata-only",
});

await agent.invoke(input, { callbacks: [callback] });
```

See [docs/ADAPTERS.md](docs/ADAPTERS.md).

No-network recipes: [ai-sdk-local-telemetry](examples/recipes/ai-sdk-local-telemetry/), [openai-agents-local-tracing](examples/recipes/openai-agents-local-tracing/), and [langgraph-callback-local](examples/recipes/langgraph-callback-local/).

### Path C — Manually instrument custom flows

Use `inspectRun` and `step` when you want explicit names, custom nesting, or flows that are not object/class shaped.

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

Use the root import for stable beginner APIs:

```ts
import {
  createInspector,
  observe,
  inspectRun,
  maybeInspectRun,
  step,
  getCurrentCorrelationMetadata,
} from "agent-inspect";
```

Use subpaths for advanced, experimental, or lower-level workflows:

```ts
import { openTrace } from "agent-inspect/readers";
import { memoryWriter } from "agent-inspect/writers";
import { runTraceChecks } from "agent-inspect/checks";
import { diffTraceEvents } from "agent-inspect/diff";
import { exportMarkdown } from "agent-inspect/exporters";
import { parseLogsToTrees } from "agent-inspect/logs";
import { traceEventsToPersistedInspectEvents } from "agent-inspect/persisted";
import { createInspectorRuntime } from "agent-inspect/advanced";
```

**Env-gated tracing** (eval harnesses, CI): use `maybeInspectRun` and set `AGENT_INSPECT=1` when you want a trace — otherwise no files are written.

```ts
import { maybeInspectRun } from "agent-inspect";

await maybeInspectRun("eval-case-42", async () => runAgent());
```

```bash
AGENT_INSPECT=1 node eval-runner.mjs
```

## What you can do today

- **Trace manually** with `inspectRun`, `step`, `step.llm`, `step.tool`, and `observe` — local JSONL under `.agent-inspect/` by default.
- **Toggle tracing** with `maybeInspectRun` and `AGENT_INSPECT=1` in eval harnesses or CI.
- **Use an isolated inspector** with `createInspector()` and explicit local writers for tests/adapters.
- **Correlate runs** with optional `correlationId`, `requestId`, `decisionId`, and `groupId` on `run_started` metadata.
- **Redact before disk** with default key-based redaction, or choose `redactionProfile`: `local`, `share`, or `strict`.
- **Inspect from the CLI** — `list`, `view`, `clean`, `logs`, `tail`, `export`, `open`, `migrate`, `eval`, `redact`, `diff`, `timeline`, `stats`, `search`, `what`, `report`.
- **Run local evals** with `agent-inspect eval` or `@agent-inspect/eval`; built-in checks are deterministic heuristics over local traces, not model judges.
- **Redact local files** with `agent-inspect redact` or `@agent-inspect/redact` before creating shareable copies.
- **Migrate explicitly** with `agent-inspect migrate <trace.jsonl> --to 1.0 --dry-run` or `--output <file>`; originals are never overwritten by default.
- **Export share-safe copies** — `export --redaction-profile share` (or `strict`) writes local Markdown/HTML/OpenInference/OTLP JSON only.
- **Create local CI artifacts** with `agent-inspect artifacts`, and summarize local test-reporter manifests with `agent-inspect ci-summary`.
- **Parse structured logs** you already emit (JSON first-class; log4js best-effort).
- **Optional LangChain adapter** — metadata-only by default; optional `persist: true` and `stream: true` streaming metadata (no full token capture by default).
- **Optional AI SDK adapter** — experimental `@agent-inspect/ai-sdk` telemetry integration for AI SDK v6; metadata-only by default with `recordInputs: false` and `recordOutputs: false`.
- **Optional OpenAI Agents adapter** — experimental `@agent-inspect/openai-agents` trace processor for local OpenAI Agents JS trace processing.
- **Optional TUI** — `view --tui` when `@agent-inspect/tui` is installed.
- **Persisted-event foundation** — v0.1/v0.2/v1.0 AgentInspect JSONL remains readable; `createInspector()` and built-in writers use the schema 1.0 persisted path.
- **Experimental subpaths** — `agent-inspect/readers`, `/writers`, `/checks`, `/diff`, `/exporters`, `/logs`, `/persisted`, and `/advanced` for advanced local workflows.

Nothing uploads traces by default. Review exports before sharing — see [safe trace sharing](docs/SAFE-TRACE-SHARING.md).

## What the trace shows

Each run produces a **JSONL** trace: `run_started` / `run_completed`, `step_started` / `step_completed`, with **nested steps**, **tool/LLM** types where you use `step.tool` / `step.llm`, and **durations** on completed steps. Failures are recorded on `step_completed` with `status: "error"` (there is no separate `step_failed` event). See [docs/SCHEMA.md](docs/SCHEMA.md).

![Nested execution tree from a local JSONL trace](https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/demos/execution-tree.gif)

*Synthetic demo — [examples/02-nested-steps](examples/02-nested-steps/README.md). More visuals: [SCREENSHOTS.md](docs/SCREENSHOTS.md).*

## Advanced ingestion: use this when your app already emits structured logs

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
| `open` | Read AgentInspect JSONL, OpenInference JSON, or OTLP JSON locally |
| `migrate` | Convert a local AgentInspect JSONL file to schema 1.0 with dry-run or explicit output |
| `eval` | Deterministic local evals over existing traces |
| `redact` | Redact a local JSON/JSONL file or trace copy |
| `diff` | Compare two local runs (read-only) |
| `timeline` | Chronological view of one run |
| `stats` | Local aggregates over a trace directory |
| `search` | Deterministic search over local traces |
| `what` | Concise summary of one run |
| `report` | Markdown/HTML inspection report (what + timeline + tree) |
| `check` / `scan` / `verify-safe` | Deterministic local trace checks and best-effort safety verification |
| `artifacts` | Safe local CI artifact bundles and optional step-summary file output |
| `ci-summary` | Summarize local Vitest/Jest reporter artifact manifests for CI |

![Timeline with slow-step focus for one run](https://raw.githubusercontent.com/rajudandigam/agent-inspect/main/docs/assets/demos/timeline.gif)

*Synthetic demo — `agent-inspect timeline` on [fixtures/traces](fixtures/traces). Gallery: [SCREENSHOTS.md](docs/SCREENSHOTS.md).*

Full flags and behavior: [docs/CLI.md](docs/CLI.md).

## Real-world workflows

- Debug a **failed tool call** or thrown error in a support or ops agent.
- See **which step dominated latency** in a multi-step planner or RAG pipeline.
- **Diff two runs** after a prompt, model, or routing change (see [diff examples](docs/DIFF.md)).
- Run **local eval checks** over a trace before sharing or creating CI artifacts.
- **Redact** a local trace/file before attaching it to a PR, issue, or support thread.
- Point **`logs`** / **`tail`** at existing job or service logs to get a **local execution view** without shipping data upstream.
- **Export** a run to Markdown for a PR, postmortem, or internal thread — use `--redaction-profile share` for share-safe copies, then review before sharing.
- Keep traces **on disk** while still using enterprise observability elsewhere.

## Stable foundation

AgentInspect is the **local-first trace workbench** for TypeScript AI agents:

- Instrument runs with `inspectRun` and `step`
- Write and read **local JSONL traces** (`schemaVersion: "0.1"` manual traces remain readable; schema 1.0 persisted rows are the v2 writer target)
- Inspect with **`list`**, **`view`**, **`clean`**, **`logs`**, **`tail`**, **`export`**, **`diff`**, **`timeline`**, **`stats`**, **`search`**, **`sessions`**, **`session`**

**Stable root APIs:** `createInspector()`, `inspectRun()`, `maybeInspectRun()`, `step()`, `step.llm()`, `step.tool()`, `observe()`, `getCurrentCorrelationMetadata()`.

Pass `enabled: false` to `inspectRun` for a no-trace passthrough. Use `maybeInspectRun` with `AGENT_INSPECT=1` to toggle tracing in eval or CI — see [docs/API.md](docs/API.md).

**v2.4 shipped:** sessions/MCP client telemetry on `main@2.4.0`. All ten linked packages published at `2.4.0` including `@agent-inspect/mcp`.

**v2.3 shipped:** adapter hardening for AI SDK, OpenAI Agents JS, and LangChain/LangGraph with no-network recipes and executable conformance coverage. Mastra and NestJS framework packages remain demand-gated; NestJS is covered through structured-log ingestion.

**Shipped in 2.2.0:** public optional Vitest/Jest reporter packages, shared `agent-inspect/reporters` helpers, and `agent-inspect ci-summary` for deterministic local reporter artifact summaries. Linked release aligns `agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, `@agent-inspect/tui`, `@agent-inspect/openai-agents`, `@agent-inspect/redact`, `@agent-inspect/eval`, `@agent-inspect/vitest`, and `@agent-inspect/jest` at **2.2.0**.

**Shipped in 2.1.0:** deterministic local eval and redaction utilities. Linked release aligns `agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, `@agent-inspect/tui`, `@agent-inspect/openai-agents`, `@agent-inspect/redact`, and `@agent-inspect/eval` at **2.1.0**.

**Shipped in 2.0.0:** stable root API contract, schema 1.0 persisted writer path, v0.1/v0.2/v1.0 read compatibility, and explicit trace migration workflow. Linked release aligns `agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, `@agent-inspect/tui`, and `@agent-inspect/openai-agents` at **2.0.0**.

**Shipped in 1.9.0:** private harness workspace foundation, explain dry-run/local analysis, promoted adapter adoption paths, and the v2 root API slimming plan.

**Shipped in 1.8.0:** experimental deterministic checks (`agent-inspect/checks` and `agent-inspect check`), safe-sharing workflows (`scan`, `verify-safe`, safe artifacts), and first public `@agent-inspect/openai-agents` package. Linked release aligns `agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, `@agent-inspect/tui`, and `@agent-inspect/openai-agents` at **1.8.0**.

**Shipped in 1.7.0:** experimental `@agent-inspect/ai-sdk` telemetry integration for AI SDK v6 with a local no-network [ai-sdk-local-telemetry recipe](examples/recipes/ai-sdk-local-telemetry/), adapter conformance fixtures, OpenAI Agents/LangGraph support decisions, and local-first adapter docs. Examples keep `recordInputs: false`, `recordOutputs: false`, metadata-only capture, and no upload behavior. Linked release aligns `agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, and `@agent-inspect/tui` at **1.7.0**.

**Shipped in 1.6.0:** experimental writer subpath (`agent-inspect/writers`), isolated `createInspector()` API via `agent-inspect/advanced`, local trace readers via `agent-inspect/readers`, OpenInference/OTLP JSON readers, universal `agent-inspect open`, and deterministic [runtime-and-ingestion recipe](examples/recipes/runtime-and-ingestion/). These remain local-only and do not add upload behavior. Linked release aligns all three then-published npm packages at **1.6.0**.

**Shipped in 1.5.0:** non-breaking subpath exports; `what` and `report` CLI; dual-format read path (v0.1 + v0.2 JSONL); [what-report-inspect recipe](examples/recipes/what-report-inspect/). Linked release aligns all three npm packages at **1.5.0**.

**Roadmap beyond current release work:** v2.5 guardrails/circuit patterns, optional viewer/IDE surfaces, and conditional v3 extensibility. See [ROADMAP.md](ROADMAP.md).

**Shipped in 1.4.0:** CI artifact recipe ([docs/CI-ARTIFACTS.md](docs/CI-ARTIFACTS.md)); `timeline`, `stats`, and `search` CLI; core helpers `buildRunTimeline`, `buildTraceStats`, `searchTraces`. Linked release aligns all three npm packages at **1.4.0**.

**Shipped in 1.3.0:** correlation metadata; redaction profiles (`local` / `share` / `strict`); `export --redaction-profile`; LangChain `stream: true` metadata (chunk counts, duration — no full token capture by default).

**Also in 1.x** (local-first extensions):

- **v1.2.0** — experimental persisted-event foundation (`PersistedInspectEvent`, converters, in-memory tree bridge). Manual writing remains **`schemaVersion: "0.1"`**; v0.2 is **not written by default**.
- Optional **`@agent-inspect/langchain`** and **`@agent-inspect/tui`**
- **Fixtures** and **recipes** for deterministic adoption patterns

**Honest boundaries:** log parsing, export, diff, LangChain/TUI programmatic APIs, and OpenInference/OTLP JSON exports are **experimental or compatibility-oriented**. Nothing performs **vendor upload** by default.

## Optional packages

### Framework adapters (`@agent-inspect/ai-sdk`, `@agent-inspect/openai-agents`, `@agent-inspect/langchain`)

Official framework adapters are optional packages and stay explicit, local-first, and metadata-only by default:

- **AI SDK:** pass `agentInspect(...)` through AI SDK telemetry with `recordInputs: false` and `recordOutputs: false`.
- **OpenAI Agents JS:** use `setTraceProcessors([agentInspectProcessor(...)])` for the documented local-only replacement path.
- **LangChain/LangGraph:** pass `new AgentInspectCallback(...)` through callbacks; LangGraph support rides through the LangChain callback boundary.

No-network recipes: [ai-sdk-local-telemetry](examples/recipes/ai-sdk-local-telemetry/), [ai-sdk-next-route](examples/recipes/ai-sdk-next-route/), [openai-agents-local-tracing](examples/recipes/openai-agents-local-tracing/), and [langgraph-callback-local](examples/recipes/langgraph-callback-local/). Conformance and limits are documented in [docs/ADAPTERS.md](docs/ADAPTERS.md) and [docs/ADAPTER-CONFORMANCE.md](docs/ADAPTER-CONFORMANCE.md).

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

### MCP client telemetry (`@agent-inspect/mcp`)

Optional package for **local MCP client** tracing only. Wrap `tools/list` and `tools/call` so they emit tool steps with `source.type: mcp-client`, bounded argument summaries, server identity, and optional `sessionId` metadata.

```bash
pnpm add agent-inspect @agent-inspect/mcp
```

```ts
import { inspectRun } from "agent-inspect";
import { wrapMcpClient } from "@agent-inspect/mcp";

const traced = wrapMcpClient(mcpClient, {
  serverName: "docs-server",
  sessionId: "sess-123",
});

await inspectRun("agent-with-mcp", async () => {
  await traced.callTool({ name: "search", arguments: { query: "sessions" } });
});
```

No-network recipe: [mcp-client-tracing](examples/recipes/mcp-client-tracing/). This is **not** an MCP server, gateway, or hosted broker — see [docs/ADAPTERS.md](docs/ADAPTERS.md).

### Local viewer (`@agent-inspect/viewer`)

Optional **localhost read-only** HTTP viewer. Start from the CLI:

```bash
pnpm add agent-inspect @agent-inspect/viewer
npx agent-inspect serve --dir ./.agent-inspect-runs
```

Binds `127.0.0.1` by default. Serves trace list, timeline, and check JSON from disk — no upload, no mutation. Recipe: [read-only viewer workflow](examples/recipes/read-only-mcp-server/) (also covers MCP server tools).

### Read-only MCP server (`@agent-inspect/mcp-server`)

Optional package exposing **read-only** MCP tools (`list_traces`, `read_trace`, `search_traces`, `run_checks`, `create_share_safe_report`, and analysis helpers) over a local trace directory. Distinct from `@agent-inspect/mcp` (client telemetry). Default redaction profile is `share`.

```bash
pnpm add agent-inspect @agent-inspect/mcp-server
```

```ts
import { runReadOnlyMcpServer } from "@agent-inspect/mcp-server";

// stdio MCP server — configure trace dir via AGENT_INSPECT_TRACE_DIR
await runReadOnlyMcpServer({ redactionProfile: "share" });
```

IDE extension is **deferred** — see [docs/IDE-SURFACES.md](docs/IDE-SURFACES.md).

### TUI viewer (`@agent-inspect/tui`)

Optional **Ink/React** package, installed separately. Use with an interactive terminal:

```bash
pnpm add agent-inspect @agent-inspect/tui
npx agent-inspect view <run-id> --tui
```

The TUI is available as a separate optional package; its programmatic API is experimental, while the CLI integration (`view --tui`) is the intended usage. Details: [docs/ADAPTERS.md](docs/ADAPTERS.md).

### Test reporter artifacts (`@agent-inspect/vitest`, `@agent-inspect/jest`)

Optional Vitest/Jest reporter packages are public as of v2.2. They write shared `schemaVersion: "0.1"` reporter manifests with safe relative artifact paths and bounded structural metadata. Use `agent-inspect ci-summary` to summarize those local manifests in CI without reading trace contents or calling GitHub APIs.

Reporter artifact behavior and API details are documented in [docs/API.md](docs/API.md) and [docs/CI-ARTIFACTS.md](docs/CI-ARTIFACTS.md).

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
| [examples/recipes/deterministic-ci-checks](examples/recipes/deterministic-ci-checks) | v1.8 checks, baseline, and safe CI artifacts |
| [examples/recipes/eval-local-checks](examples/recipes/eval-local-checks) | v2.1 deterministic local eval checks |
| [examples/recipes/redact-share-safe-file](examples/recipes/redact-share-safe-file) | v2.1 share-safe local redaction copy |
| [examples/recipes/eval-ci-artifacts](examples/recipes/eval-ci-artifacts) | v2.1 eval before safe CI artifacts |
| [examples/recipes/test-reporter-artifacts](examples/recipes/test-reporter-artifacts) | Vitest/Jest reporter artifact patterns |
| [examples/recipes/what-report-inspect](examples/recipes/what-report-inspect/) | `what` + `report` inspection |
| [examples/recipes/runtime-and-ingestion](examples/recipes/runtime-and-ingestion/) | v1.6 runtime writers + universal ingestion |
| [examples/recipes/mcp-client-tracing](examples/recipes/mcp-client-tracing) | v2.4 MCP client tool-call tracing |
| [examples/recipes/guardrails-basic](examples/recipes/guardrails-basic) | v2.5 deterministic guardrails |
| [examples/recipes/circuit-breaker-basic](examples/recipes/circuit-breaker-basic) | v2.5 circuit analyzers |
| [examples/recipes/read-only-mcp-server](examples/recipes/read-only-mcp-server) | v2.6 read-only MCP trace tools |

**Multi-run sessions:** set `sessionId` (and optional handoff/retry metadata) on `run_started`, then browse with `npx agent-inspect sessions` and `npx agent-inspect session <id> --timeline`. See [SESSIONS-AND-WORKFLOW-CAUSALITY](docs/proposals/SESSIONS-AND-WORKFLOW-CAUSALITY.md).

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
