# agent-inspect

**AgentInspect is a local-first execution-tree debugger for TypeScript AI agents.**

Runs and steps are recorded as JSONL under your trace directory. Use the CLI to list and inspect runs instead of piecing together `console.log` output.

## Install

```bash
npm install agent-inspect
```

*(The repo stays `private: true` until you intentionally publish.)*

## Quickstart (API)

```typescript
import { inspectRun, step } from "agent-inspect";

await inspectRun("my-agent-run", async () => {
  const plan = await step("plan", async () => ({ task: "research" }));
  return step("act", async () => plan);
});
```

### `observe()` (top-level methods)

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

`observe()` wraps `run`, `execute`, and `invoke` with tracing. For nested detail, add `step()` inside your agent.

## CLI

After a build (`pnpm build`):

```bash
node packages/cli/dist/index.cjs list
node packages/cli/dist/index.cjs view <run-id>
```

With the CLI on your `PATH`:

```bash
agent-inspect list
agent-inspect view <run-id>
```

## Examples

See **[examples/README.md](examples/README.md)** for the full table and run instructions.

- **Basic workflow** — [examples/01-basic](examples/01-basic)
- **Nested steps** — [examples/02-nested-steps](examples/02-nested-steps)
- **Parallel steps** — [examples/03-parallel-steps](examples/03-parallel-steps)
- **Error handling** — [examples/04-error-handling](examples/04-error-handling)
- **`observe()` wrapper** — [examples/05-observe-wrapper](examples/05-observe-wrapper)

### Quick verification

```bash
pnpm build
cd examples/01-basic
pnpm install
pnpm start
node ../../packages/cli/dist/index.cjs list
```

Examples show **terminal** output by default. Use `AGENT_INSPECT_SILENT=true pnpm start` for quiet runs.

From the repo root you can also run `pnpm run examples:check` (example 01 only).

Future / post-MVP example ideas: [docs/EXAMPLES_ROADMAP.md](docs/EXAMPLES_ROADMAP.md). Short before/after narrative: [docs/CASE_STUDY_CONSOLE_LOG_TO_AGENT_INSPECT.md](docs/CASE_STUDY_CONSOLE_LOG_TO_AGENT_INSPECT.md).

Product scope: `docs/AGENT_INSPECT_PRD_FINAL.md`.
