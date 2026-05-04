# agent-inspect

**AgentInspect is a local-first execution-tree debugger for TypeScript AI agents.**

Runs and steps are recorded as JSONL under your trace directory. Use the CLI to list and inspect runs instead of piecing together `console.log` output.

## Install

```bash
npm install agent-inspect
```

*(Repository stays `private: true` until you intentionally publish.)*

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

With the package on your `PATH`:

```bash
agent-inspect list
agent-inspect view <run-id>
```

## Examples

| Example | Topic |
|--------|--------|
| [examples/01-basic](examples/01-basic) | `inspectRun` + `step` |
| [examples/02-nested-steps](examples/02-nested-steps) | Nested tree, `step.llm`, `step.tool` |
| [examples/03-parallel-steps](examples/03-parallel-steps) | `Promise.all` siblings |
| [examples/04-error-handling](examples/04-error-handling) | Failed step + trace |
| [examples/05-observe-wrapper](examples/05-observe-wrapper) | `observe()` class agent |

In each example folder: `pnpm install` then `pnpm start`.

Smoke the first example from the repo root:

```bash
pnpm run examples:check
```

Product scope and roadmap: `docs/AGENT_INSPECT_PRD_FINAL.md`.
