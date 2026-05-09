# agent-inspect

Local execution trees for TypeScript AI agents.

AgentInspect helps you debug multi-step AI workflows locally by turning manual steps, structured logs, and agent callbacks into readable execution trees.

No account. No cloud upload. No dashboard required.

## Install

```bash
npm install agent-inspect
```

```bash
pnpm add agent-inspect
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
      await delay(50);
      return { query: "refund policy", intent: "support" };
    });

    const docs = await step.tool("search-docs", async () => {
      await delay(75);
      return ["Refunds are available within 30 days."];
    });

    return step.llm("answer", async () => {
      await delay(100);
      return `Based on ${docs.length} document(s), refunds are available within 30 days.`;
    });
  },
  { traceDir: "./.agent-inspect" }
);
```

Run it, then inspect it:

```bash
node demo.mjs
npx agent-inspect list --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect --summary
```

Example output:

```text
Run run_abc123 (support-agent)
├─ ✔ plan (50ms)
├─ ✔ tool:search-docs (75ms)
└─ ✔ llm:answer (100ms)

Summary:
  Steps: 3 (0 error)
  Duration: 225ms
```

Want a runnable demo folder? See [examples/00-quickstart-demo](examples/00-quickstart-demo/README.md).

## Why not just console.log?

Console logs are great for quick values, but they’re flat. AgentInspect gives you:

- run grouping and local trace files
- explicit step boundaries (including nesting)
- step types (`tool:*`, `llm:*`)
- status + duration summaries
- a CLI to list/view/export/diff runs
- log ingestion workflows (`logs`, `tail`) when you already have structured logs

## When to use AgentInspect

Use AgentInspect when:

- you are building TypeScript/Node.js AI agents
- you want local debugging before a hosted observability setup
- console logs are too flat for multi-step execution
- you want to inspect tool calls, LLM calls, failures, and durations locally
- you want a lightweight CLI workflow with no account and no cloud upload
- you want to compare two local runs
- you want to turn structured logs into readable execution trees

## When not to use AgentInspect

Do not use AgentInspect as a replacement for:

- production monitoring or alerting
- hosted observability dashboards
- long-term trace storage
- eval dataset management
- prompt management
- cost analytics
- replay/fork execution
- vendor telemetry pipelines

AgentInspect can complement tools like LangSmith, Langfuse, Braintrust, Phoenix/OpenInference, OpenTelemetry, New Relic, Datadog, etc. It does not replace their production/eval/dashboard workflows.

## Security and privacy posture

- local files only by default (no upload)
- no vendor sinks
- no API keys required
- small root dependency footprint
- traces can include **user-provided metadata**; review exports before sharing

See `SECURITY.md`.

## Documentation

- **Getting started**: `docs/GETTING-STARTED.md`
- **API**: `docs/API.md`
- **CLI**: `docs/CLI.md`
- **Schema**: `docs/SCHEMA.md`
- **Logs**: `docs/LOGS.md` and `docs/LOG-TO-TREE-QUICKSTART.md`
- **Exports**: `docs/EXPORTS.md`
- **Diff**: `docs/DIFF.md`
- **Adapters**: `docs/ADAPTERS.md`
- **Compare with other tools**: `docs/COMPARE.md`
- **Known issues / limitations**: `docs/KNOWN-ISSUES.md`, `docs/LIMITATIONS.md`

Screenshots/GIFs are planned; see `docs/SCREENSHOTS.md`.

## Maintainer / internal docs (local-only)

- `docs-local/RELEASE-CHECKLIST.md`
- `docs-local/V1-READINESS-CHECKLIST.md`

## Minimal API

```ts
import { inspectRun, step } from "agent-inspect";

await inspectRun("my-agent-run", async () => {
  const plan = await step("plan", async () => ({ task: "research" }));
  return step("act", async () => plan);
});
```

## LLM and tool helpers

```ts
await step.llm("mock-gpt", async () => {
  return planner.run();
});

await step.tool("searchHotels", async () => {
  return searchHotels();
});
```

Helpers only label steps in the trace.

They do not import or call vendor SDKs.

## observe()

`observe()` wraps top-level `run`, `execute`, and `invoke`.

For internal detail, add manual `step()` calls inside the agent.

```ts
import { observe } from "agent-inspect";

class MyAgent {
  async run(input: string) {
    return `ok: ${input}`;
  }
}

const agent = observe(new MyAgent());
await agent.run("hello");
```

See [examples/05-observe-wrapper](examples/05-observe-wrapper) for a top-level observed run with internal `step()`, `step.tool()`, and `step.llm()` calls.

## Usage examples

### Example 1: Basic workflow

```ts
import { inspectRun, step } from "agent-inspect";

const result = await inspectRun("hotel-booking", async () => {
  const hotels = await step("search-hotels", async () => {
    return ["Tokyo Grand Hotel", "Tokyo Central Inn"];
  });

  const availability = await step("check-availability", async () => {
    return { hotel: hotels[0], rooms: 2 };
  });

  return step("finalize-booking", async () => {
    return `confirmed:${availability.hotel}`;
  });
});

console.log(result);
```

Expected tree:

```text
hotel-booking
✔ search-hotels
✔ check-availability
✔ finalize-booking
```

### Example 2: Nested LLM and tool steps

```ts
import { inspectRun, step } from "agent-inspect";

await inspectRun("trip-planner", async () => {
  const plan = await step("plan-trip", async () => {
    const draft = await step.llm("mock-gpt", async () => {
      return "Plan: museum, dinner, evening walk.";
    });

    return step("parse-plan", async () => {
      return draft.replace("Plan: ", "").split(", ");
    });
  });

  const hotels = await step.tool("searchHotels", async () => {
    return [{ id: "h1", city: "Kyoto" }];
  });

  return step("finalize", async () => {
    return { plan, hotel: hotels[0] };
  });
});
```

Expected tree:

```text
trip-planner
✔ plan-trip
  ✔ llm:mock-gpt
  ✔ parse-plan
✔ tool:searchHotels
✔ finalize
```

### Example 3: Error handling

```ts
import { inspectRun, step } from "agent-inspect";

try {
  await inspectRun("pricing-flow", async () => {
    await step("load-catalog", async () => ["sku-a", "sku-b"]);

    await step("fetch-dynamic-pricing", async () => {
      throw new Error("Pricing API timeout");
    });

    await step("apply-discount", async () => {
      return "this step will not run";
    });
  });
} catch (error) {
  console.error("Original error still propagated:", error);
}
```

agent-inspect records the failed step, writes it to the trace file, and still rethrows the original error.

### Example 4: `observe()` wrapper

```ts
import { observe, step } from "agent-inspect";

class CustomerSupportAgent {
  async run(question: string): Promise<string> {
    const category = await step("triage-question", async () => {
      return question.toLowerCase().includes("password")
        ? "account-access"
        : "general";
    });

    const articles = await step.tool("retrieveArticles", async () => {
      return ["Reset your password from the login page."];
    });

    return step.llm("mock-support-model", async () => {
      return `Category: ${category}. ${articles[0]}`;
    });
  }
}

const agent = observe(new CustomerSupportAgent());
await agent.run("How do I reset my password?");
```

`observe()` wraps top-level `run`, `execute`, and `invoke` methods. For internal detail, add manual `step()` calls inside the agent.

## LangChain adapter (v0.5, experimental)

Install:

```bash
pnpm add agent-inspect @agent-inspect/langchain @langchain/core
```

`@langchain/core` is a **peer dependency** of `@agent-inspect/langchain`. The adapter uses official LangChain.js **callbacks** only (extends `BaseCallbackHandler`): **no** monkey-patching, **no** `agent-inspect/auto`, **no** vendor observability sinks.

```ts
import { AgentInspectCallback } from "@agent-inspect/langchain";

const callback = new AgentInspectCallback({
  runName: "support-agent-eval",
  capture: "metadata-only",
});

await agent.invoke(input, {
  callbacks: [callback],
});

const events = callback.getEvents();
```

Behavior:

- **Metadata-only** capture by default (model, tags, token usage when present, counts). **No** full prompt/output capture by default.
- **Preview** mode is opt-in (`capture: "preview"`) with truncation via `maxPreviewChars` (default `200`).
- **Parent** links use LangChain `parentRunId`, surfaced as `parentId` on `InspectEvent` with `confidence: "explicit"`.
- **No** cost calculation; token fields are informational only.
- In this pass, events are collected **in memory** only (`getEvents()` / `clear()`). **No trace-file persistence** for adapter events yet; they are **not** written into v0.1 JSONL manual traces.

The API is **experimental** before v1.0. See [examples/08-langchain-adapter](examples/08-langchain-adapter).

## CLI

List recent runs:

```bash
npx agent-inspect list
```

Common filters:

```bash
npx agent-inspect list --status success
npx agent-inspect list --status error
npx agent-inspect list --status running
npx agent-inspect list --status unknown
npx agent-inspect list --name hotel
npx agent-inspect list --since 24h
npx agent-inspect list --json
```

View a run:

```bash
npx agent-inspect view run_abc123
```

Alternate view modes:

```bash
npx agent-inspect view run_abc123 --summary
npx agent-inspect view run_abc123 --metadata
npx agent-inspect view run_abc123 --errors-only
npx agent-inspect view run_abc123 --json --summary
```

Safely clean up old traces (recommended: start with `--dry-run`):

```bash
npx agent-inspect clean --older-than 7d --dry-run
npx agent-inspect clean --older-than 7d
npx agent-inspect clean --keep 100 --dry-run
npx agent-inspect clean --keep 100 --yes
npx agent-inspect clean --dir ./traces --older-than 7d --dry-run
```

Safety notes:

- `clean` **verifies each file** as an AgentInspect trace before deleting.
- Arbitrary JSONL files are **not deleted**.
- Malformed JSONL files are **not deleted**.
- Without `--dry-run`, `clean` requires confirmation unless `--yes` is provided.
- In non-interactive terminals, deletion requires `--yes`.

Inspect structured logs:

```bash
npx agent-inspect logs ./agent.log --format json
npx agent-inspect logs ./agent.log --format log4js
npx agent-inspect logs ./agent.log --format auto
npx agent-inspect logs ./agent.log --config agent-inspect.logs.json
npx agent-inspect logs ./agent.log --json
npx agent-inspect logs ./agent.log --summary
npx agent-inspect logs ./agent.log --warnings all
```

Log ingestion notes:

- JSON logs are first-class.
- log4js text logs are best-effort: only embedded **valid JSON payloads** are supported.
- JavaScript object-literal payloads are intentionally unsupported.
- No eval is used.
- Flat timeline is default (nesting only with explicit `parentId`).
- Confidence labels explain attribution.
- Redaction is applied to sensitive attributes (based on config).

Live tail structured logs:

```bash
npx agent-inspect tail --file ./agent.log --format json
npx agent-inspect tail --file ./agent.log --format log4js --config agent-inspect.logs.json
npm run dev 2>&1 | npx agent-inspect tail --format log4js --config agent-inspect.logs.json
npx agent-inspect tail --file ./agent.log --format auto --once
npx agent-inspect tail --file ./agent.log --json --once
```

Use a custom trace directory:

```bash
npx agent-inspect list --dir ./traces
npx agent-inspect view run_abc123 --dir ./traces
```

By default, traces are stored under `~/.agent-inspect/runs`.

You can also set a default trace directory with:

```bash
AGENT_INSPECT_TRACE_DIR=./traces npx agent-inspect list
```

For local repo development after `pnpm build`:

```bash
node packages/cli/dist/index.cjs list
node packages/cli/dist/index.cjs view run_abc123
```

## Local traces

agent-inspect writes one JSONL file per run.

Default location:

```text
~/.agent-inspect/runs
```

Example event shape:

```json
{"schemaVersion":"0.1","event":"step_started","name":"search-hotels","type":"logic"}
```

You can inspect traces with standard tools:

```bash
cat ~/.agent-inspect/runs/run_abc123.jsonl
cat ~/.agent-inspect/runs/run_abc123.jsonl | jq
```

## Runnable examples

The repo includes five runnable MVP manual-tracing examples, the v0.3 structured log-to-tree example, and the v0.5 LangChain adapter example:

- `examples/01-basic` — `inspectRun()` + `step()`
- `examples/02-nested-steps` — nested execution tree hierarchy
- `examples/03-parallel-steps` — `Promise.all` sibling isolation
- `examples/04-error-handling` — failed steps and error traces
- `examples/05-observe-wrapper` — `observe()` wrapper with internal steps
- `examples/06-log-to-tree` — v0.3 structured log-to-tree example (includes historical spike prototype and production `agent-inspect logs` usage)
- `examples/08-langchain-adapter` — v0.5 LangChain callback adapter (`@agent-inspect/langchain`), provider-free simulated lifecycle (install from repo root; see example README)

Run one locally:

```bash
pnpm build
cd examples/01-basic
pnpm install
pnpm start
```

Then inspect traces:

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view run_abc123
```

Do not commit `node_modules`. Example dependencies are installed locally when you run `pnpm install`.

Supporting material:

- [examples/README.md](examples/README.md)

## Original MVP scope

Included:

- `inspectRun()`
- `step()`
- `step.llm()`
- `step.tool()`
- `observe()`
- JSONL traces
- CLI `list` and `view`

Current scope also includes:

- CLI `clean` (safe deletion with verification)
- CLI `logs` (structured log-to-tree)
- CLI `tail` (live log tailing into grouped timelines)
- LangChain callback adapter via `@agent-inspect/langchain`
- Optional TUI viewer via `@agent-inspect/tui`
- Standards-aligned **local** exports (`export`: Markdown, HTML, OpenInference-compatible JSON, OTLP JSON mapping)
- Run diff / compare (`diff`: two local traces, read-only)
- Canonical **fixtures** under [`fixtures/`](fixtures/README.md) plus `pnpm fixtures:check` for deterministic samples

Not included:

- Live TUI / streaming trace updates in the TUI
- Direct vendor sinks or uploads (Phoenix, Langfuse, Braintrust, New Relic, Datadog, …)
- Live OTLP streaming / OTLP gRPC
- Production monitoring platforms
- Additional framework adapters beyond LangChain
- Token cost calculation
- Replay / fork execution
- SQLite
- Dashboards
- Multi-run statistical eval dashboards
- Semantic / LLM-powered trace comparison
- OpenTelemetry SDK instrumentation (exports are generated strings only)

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm test:all
```
