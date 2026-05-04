# AgentInspect examples

These are runnable **MVP** examples. They use fake async functions, **no API keys**, **no external LLM SDKs**, and **no network calls**.

| Example | Demonstrates |
|--------|----------------|
| [01-basic](01-basic) | `inspectRun()` + `step()` |
| [02-nested-steps](02-nested-steps) | Execution tree hierarchy |
| [03-parallel-steps](03-parallel-steps) | `Promise.all` sibling isolation |
| [04-error-handling](04-error-handling) | Failed steps and error traces |
| [05-observe-wrapper](05-observe-wrapper) | Proxy wrapper for agent-like objects |

## How to run

Build the library from the repo root:

```bash
pnpm build
```

Run an example:

```bash
cd examples/01-basic
pnpm install
pnpm start
```

Inspect traces:

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```

Quiet mode:

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## What is not included

Advanced examples are tracked in [docs/EXAMPLES_ROADMAP.md](../docs/EXAMPLES_ROADMAP.md) and are **intentionally post-MVP** (docs only; not runnable in this repo for v0.1).
