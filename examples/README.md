# agent-inspect examples

These examples are grouped by roadmap phase.

No example here requires API keys unless its own README says otherwise.

Further roadmap context: [docs/examples/EXAMPLES-ROADMAP.md](../docs/examples/EXAMPLES-ROADMAP.md).

## MVP manual tracing examples

Runnable from each folder after `pnpm build` at the repo root (they use `agent-inspect` via `file:../..`).

| Example | Demonstrates |
| --- | --- |
| [01-basic](01-basic) | `inspectRun()` + `step()` |
| [02-nested-steps](02-nested-steps) | Execution tree hierarchy |
| [03-parallel-steps](03-parallel-steps) | `Promise.all` sibling isolation |
| [04-error-handling](04-error-handling) | Failed steps and error traces |
| [05-observe-wrapper](05-observe-wrapper) | `observe()` wrapper for agent-like objects |

```bash
pnpm build
cd examples/01-basic
pnpm install
pnpm start
```

## Structured log examples

| Example | Demonstrates |
| --- | --- |
| [06-log-to-tree](06-log-to-tree) | Structured JSON / log4js logs into grouped execution timelines (`agent-inspect logs`, `tail`) |

See [06-log-to-tree/README.md](06-log-to-tree/README.md). Uses `prototype-parser.mjs` and/or the CLI against bundled sample logs.

## Adapter examples

| Example | Demonstrates |
| --- | --- |
| [08-langchain-adapter](08-langchain-adapter) | LangChain `BaseCallbackHandler` → in-memory `InspectEvent` capture (v0.5) |

Example **08** uses `workspace:*` for `agent-inspect` and `@agent-inspect/langchain`. **Install and run from the repository root** (not from the example folder alone):

```bash
pnpm install
pnpm --filter agent-inspect-example-08-langchain-adapter start
```

## Inspect traces (MVP flows)

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view run_abc123
```

## Quiet mode

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## What is not included

Examples beyond these numbered folders are intentionally phased; avoid pulling unnecessary runtime dependencies into the core publish tarball.
