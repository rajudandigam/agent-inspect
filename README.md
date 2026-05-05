# agent-inspect

AgentInspect is a local-first execution-tree debugger for TypeScript AI agents.

## Why

AI agents are multi-step. Console logs are flat.

AgentInspect turns runs into structured execution trees with JSONL traces and CLI inspection.

## Install

```bash
npm install agent-inspect
```

This repository keeps `"private": true` until intentional npm publishing.

## Quickstart

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

## CLI

```bash
agent-inspect list
agent-inspect view run_abc123
```

For local repo development after `pnpm build`:

```bash
node packages/cli/dist/index.cjs list
node packages/cli/dist/index.cjs view run_abc123
```

## Examples

See [examples/README.md](examples/README.md).

- [01-basic](examples/01-basic)
- [02-nested-steps](examples/02-nested-steps)
- [03-parallel-steps](examples/03-parallel-steps)
- [04-error-handling](examples/04-error-handling)
- [05-observe-wrapper](examples/05-observe-wrapper)

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
