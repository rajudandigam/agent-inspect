# agent-inspect

agent-inspect is a local-first execution-tree debugger for TypeScript AI agents.

## Why

AI agents are multi-step. Console logs are flat.

agent-inspect turns runs into structured execution trees with JSONL traces and CLI inspection.

agent-inspect is designed for inner-loop debugging, not as a replacement for production observability platforms.

## What you get

- Execution-tree tracing for TypeScript agent workflows
- Nested `step()` support with parent-child relationships
- `step.llm()` and `step.tool()` helpers for agent-aware traces
- Local JSONL trace files
- Real-time terminal output while the agent runs
- CLI commands to inspect previous runs
- No accounts, API keys, dashboards, or cloud ingestion

## Install

```bash
npm install agent-inspect
```

## See your first trace

Run a traced workflow, then inspect it with the CLI.

```ts
import { inspectRun, step } from "agent-inspect";

await inspectRun("hello-agent", async () => {
  const plan = await step("plan", async () => "search hotels");
  return step("finalize", async () => ({ plan, status: "done" }));
});
```

```bash
npx agent-inspect list
npx agent-inspect view run_abc123
```

Replace `run_abc123` with the run id printed by `agent-inspect list`.

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
- In this pass, events are collected **in memory** only (`getEvents()` / `clear()`). They are **not** written into v0.1 JSONL manual traces.

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

The repo includes five runnable MVP examples plus one v0.3 log-to-tree spike example:

- `examples/01-basic` — `inspectRun()` + `step()`
- `examples/02-nested-steps` — nested execution tree hierarchy
- `examples/03-parallel-steps` — `Promise.all` sibling isolation
- `examples/04-error-handling` — failed steps and error traces
- `examples/05-observe-wrapper` — `observe()` wrapper with internal steps
- `examples/06-log-to-tree` — v0.3 structured log-to-tree example (includes historical spike prototype and production `agent-inspect logs` usage)

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

Not included:

- Framework adapters
- Token or cost tracking
- Replay
- SQLite
- Dashboards
- OpenTelemetry

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm test:all
```
