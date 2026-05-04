# agent-inspect

AgentInspect is a **local-first execution-tree debugger** for TypeScript AI agents.

## Why

AI agents are multi-step. `console.log` output is flat and easy to lose. AgentInspect records **runs** and **steps** as a **tree** in JSONL, with durations and a small CLI so you can reopen a run later instead of reconstructing intent from logs.

## Install

```bash
npm install agent-inspect
```

This repository stays **`private: true`** until you intentionally publish the npm package.

## Quickstart

```typescript
import { inspectRun, step } from "agent-inspect";

await inspectRun("my-agent-run", async () => {
  const plan = await step("plan", async () => ({ task: "research" }));
  return step("act", async () => plan);
});
```

## LLM and tool helpers

```typescript
await step.llm("gpt-4.1", async () => {
  /* your call */
});

await step.tool("searchHotels", async () => {
  /* your call */
});
```

These only **label** steps for the trace; they do not call vendor SDKs for you.

## `observe()`

```typescript
import { observe } from "agent-inspect";

class MyAgent {
  async run(input: string) {
    return `ok: ${input}`;
  }
}

const agent = observe(new MyAgent());
await agent.run("hello");
```

**MVP:** `observe()` wraps **`run`**, **`execute`**, and **`invoke`** on an object. It does **not** auto-wrap internal methods—add **`step()`** inside the agent for nested detail (see [examples/05-observe-wrapper](examples/05-observe-wrapper)).

## CLI

```bash
agent-inspect list
agent-inspect view <run-id>
```

From a local clone after `pnpm build`:

```bash
node packages/cli/dist/index.cjs list
node packages/cli/dist/index.cjs view <run-id>
```

## Examples

See **[examples/README.md](examples/README.md)** for run and inspect instructions.

- [01-basic](examples/01-basic) — `inspectRun` + `step`
- [02-nested-steps](examples/02-nested-steps) — hierarchy
- [03-parallel-steps](examples/03-parallel-steps) — `Promise.all` siblings
- [04-error-handling](examples/04-error-handling) — errors in the trace
- [05-observe-wrapper](examples/05-observe-wrapper) — `observe()` + manual `step()`

## MVP scope

**Included**

- `inspectRun`, `step`, `step.llm`, `step.tool`, `observe`
- JSONL traces
- CLI `list` / `view`

**Not included (v0.1)**

- Framework adapters (LangChain, Vercel AI SDK, etc.)
- Token or cost tracking
- Replay, SQLite dashboards, OpenTelemetry

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm test:all
```

Roadmap (docs only): [docs/EXAMPLES_ROADMAP.md](docs/EXAMPLES_ROADMAP.md).  
Narrative: [docs/CASE_STUDY_CONSOLE_LOG_TO_AGENT_INSPECT.md](docs/CASE_STUDY_CONSOLE_LOG_TO_AGENT_INSPECT.md).  
Product definition: [docs/AGENT_INSPECT_PRD_FINAL.md](docs/AGENT_INSPECT_PRD_FINAL.md).
