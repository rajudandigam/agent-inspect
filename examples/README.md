# agent-inspect examples

Examples are grouped by theme:

- **MVP manual tracing (01–05):** `inspectRun()`, `step()`, `observe()`, JSONL traces — runnable with `file:../..` and no workspace membership required for copy-out installs.
- **Structured logs (06-log-to-tree):** v0.3 log-to-tree spike — sample logs, config, and CLI `logs` / `tail` fixtures.
- **LangChain adapter (08-langchain-adapter):** v0.5 callback adapter — depends on `workspace:*`; **install and run from the repo root** (see below).

They use fake async functions where applicable. MVP examples avoid API keys and external LLM SDKs.

| Example | Demonstrates |
| --- | --- |
| [01-basic](01-basic) | `inspectRun()` + `step()` |
| [02-nested-steps](02-nested-steps) | Execution tree hierarchy |
| [03-parallel-steps](03-parallel-steps) | `Promise.all` sibling isolation |
| [04-error-handling](04-error-handling) | Failed steps and error traces |
| [05-observe-wrapper](05-observe-wrapper) | Proxy wrapper for agent-like objects |
| [06-log-to-tree](06-log-to-tree) | Structured JSON / log4js samples + `agent-inspect logs` config |
| [08-langchain-adapter](08-langchain-adapter) | LangChain `BaseCallbackHandler` → in-memory `InspectEvent` (v0.5); workspace package; **no API keys** |

Further roadmap context: [docs/examples/EXAMPLES-ROADMAP.md](../docs/examples/EXAMPLES-ROADMAP.md).

## How to run

Build the library from the repo root:

```bash
pnpm build
```

### MVP examples (01–05)

```bash
cd examples/01-basic
pnpm install
pnpm start
```

### Structured log example (06)

See [06-log-to-tree/README.md](06-log-to-tree/README.md). Uses `node prototype-parser.mjs` and/or the CLI against the bundled sample logs.

### LangChain adapter example (08)

This package uses `workspace:*` for `agent-inspect` and `@agent-inspect/langchain`. **Use the monorepo root:**

```bash
pnpm install
pnpm --filter agent-inspect-example-08-langchain-adapter start
```

Do not rely on `pnpm install` from **only** `examples/08-langchain-adapter` outside the workspace (workspace protocol will not resolve).

## Inspect traces

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view run_abc123
```

## Quiet mode

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## What is not included

Advanced examples beyond these folders are intentionally phased post-v0.1 and should not add unnecessary dependencies to the core publish tarball.
