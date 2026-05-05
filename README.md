# agent-inspect

AgentInspect is a local-first execution-tree debugger for TypeScript AI agents.

## Why

AI agents are multi-step. Console logs are flat.

AgentInspect turns runs into structured execution trees with JSONL traces and CLI inspection.

AgentInspect is designed for inner-loop debugging, not as a replacement for production observability platforms.

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

AgentInspect records the failed step, writes it to the trace file, and still rethrows the original error.

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

## CLI

List recent runs:

```bash
npx agent-inspect list
```

View a run:

```bash
npx agent-inspect view run_abc123
```

Use a custom trace directory:

```bash
npx agent-inspect list --dir ./traces
npx agent-inspect view run_abc123 --dir ./traces
```

By default, traces are stored under `~/.agent-inspect/runs`.

For local repo development after `pnpm build`:

```bash
node packages/cli/dist/index.cjs list
node packages/cli/dist/index.cjs view run_abc123
```

## Local traces

AgentInspect writes one JSONL file per run.

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

The repo includes five runnable MVP examples:

- `examples/01-basic` — `inspectRun()` + `step()`
- `examples/02-nested-steps` — nested execution tree hierarchy
- `examples/03-parallel-steps` — `Promise.all` sibling isolation
- `examples/04-error-handling` — failed steps and error traces
- `examples/05-observe-wrapper` — `observe()` wrapper with internal steps

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

## MVP scope

Included:

- `inspectRun()`
- `step()`
- `step.llm()`
- `step.tool()`
- `observe()`
- JSONL traces
- CLI `list` and `view`

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

## More context

- [Examples roadmap](docs/EXAMPLES_ROADMAP.md)
- [Console log case study](docs/CASE_STUDY_CONSOLE_LOG_TO_AGENT_INSPECT.md)
- [Product requirements](docs/AGENT_INSPECT_PRD_FINAL.md)
