# AgentInspect Examples

These are runnable **MVP** examples.

They use fake async helpers only:

- No API keys
- No external LLM SDKs
- No network calls

| Example | Demonstrates |
| --- | --- |
| [01-basic](01-basic) | `inspectRun()` + `step()` |
| [02-nested-steps](02-nested-steps) | Execution tree hierarchy |
| [03-parallel-steps](03-parallel-steps) | `Promise.all` sibling isolation |
| [04-error-handling](04-error-handling) | Failed steps and error traces |
| [05-observe-wrapper](05-observe-wrapper) | Proxy wrapper for agent-like objects |

## Prerequisites

Build the library once from the repository root so `agent-inspect` resolves for each example package.

## How to run

Build the library from the repo root:

```bash
pnpm build
```

Run an example (pick any of the five folders under `examples/`):

```bash
cd examples/01-basic
pnpm install
pnpm start
```

## Inspect traces

After a run finishes, list recent traces:

```bash
node ../../packages/cli/dist/index.cjs list
```

Open a specific run (replace with a real id from `list` output; placeholder below):

```bash
node ../../packages/cli/dist/index.cjs view run_abc123
```

## Quiet mode

Suppress terminal progress output while still writing JSONL:

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## What is not included

Advanced examples are tracked in [docs/EXAMPLES_ROADMAP.md](../docs/EXAMPLES_ROADMAP.md) and are intentionally **post-MVP**.

They are docs-only for v0.1 and should not add dependencies to the MVP package.
