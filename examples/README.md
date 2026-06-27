# agent-inspect examples

Runnable samples grouped by adoption path. No example requires paid API keys unless its README says otherwise.

Roadmap context: [ROADMAP.md](../ROADMAP.md), [docs/README.md](../docs/README.md), and [examples/recipes/README.md](recipes/README.md). Historical examples roadmap note: `docs-local/examples/EXAMPLES-ROADMAP.md`.

Canonical **deterministic fixtures** (traces, logs, configs) for CI and docs: [`fixtures/`](../fixtures/README.md).

## Quick reference

| Example / area | Version | Purpose | Runnable locally | External services |
|----------------|---------|---------|------------------|-------------------|
| [00-quickstart-demo](00-quickstart-demo) | v1.0 | 60–90 second install-and-try demo | yes (`npm start` from folder) | no |
| [05-observe-wrapper](05-observe-wrapper) | v0.1 | `observe()` wrapper for existing objects/classes | yes | no |
| [01-basic](01-basic) | v0.1 | Manual `inspectRun` + `step()` | yes (`pnpm start` from folder) | no |
| [02-nested-steps](02-nested-steps) | v0.1 | Nested execution tree | yes | no |
| [03-parallel-steps](03-parallel-steps) | v0.1 | Parallel sibling steps | yes | no |
| [04-error-handling](04-error-handling) | v0.1 | Failed steps in traces | yes | no |
| [08-langchain-adapter](08-langchain-adapter) | v0.5 | LangChain callbacks | yes from repo root (`pnpm --filter …`) | no API keys (mocked) |
| [06-log-to-tree](06-log-to-tree) | v0.3 | Advanced structured-log ingestion with `logs` / `tail` | yes (see README) | no |
| Optional TUI (`npx agent-inspect view --tui`) | v0.6 | Interactive viewer | requires interactive terminal | no |
| CLI `export` | v0.7 | Standards-oriented exports | yes (`npx agent-inspect export …`) | no |
| CLI `diff` | v0.8 | Compare two local traces | yes (`npx agent-inspect diff …`) | no |
| `recipes/*` | v0.9 | Adoption-focused runnable recipes ([examples/recipes/](recipes/README.md)) | yes (`pnpm start` per recipe README) | no by default |

Folders **07-live-tail**, **09-tui**, **10-standards-export**, and **11-diff-compare** are **not** present as standalone `examples/*` directories; use the **CLI** (`tail`, `export`, `diff`) and docs above.

## Recipes (v0.9)

Runnable **recipe** packages live under [**examples/recipes/**](recipes/README.md). They illustrate realistic patterns—RAG-shaped traces, retries, multi-step handoffs, advanced structured-log ingestion, LLM fallback, parallel tools, deterministic CI checks/artifacts, and test-reporter artifact configuration—using **deterministic mocks only**. No API keys or external services are required by default; traces write to each recipe’s local `.agent-inspect-runs/` or similarly named ignored local trace directories.

See the [recipe index](recipes/README.md) for commands and which AgentInspect features each recipe exercises.

## MVP manual tracing and observe

Runnable from each folder after `pnpm build` at the repo root (they use `agent-inspect` via `file:../..`).

| Example | Demonstrates |
| --- | --- |
| [05-observe-wrapper](05-observe-wrapper) | `observe()` wrapper for agent-like objects |
| [01-basic](01-basic) | `inspectRun()` + `step()` |
| [02-nested-steps](02-nested-steps) | Execution tree hierarchy |
| [03-parallel-steps](03-parallel-steps) | `Promise.all` sibling isolation |
| [04-error-handling](04-error-handling) | Failed steps and error traces |

```bash
pnpm build
cd examples/01-basic
pnpm install
pnpm start
```

## Advanced structured-log ingestion (Structured log examples)

| Example | Demonstrates |
| --- | --- |
| [06-log-to-tree](06-log-to-tree) | Structured JSON / log4js logs into grouped execution timelines (`agent-inspect logs`, `tail`) |

See [06-log-to-tree/README.md](06-log-to-tree/README.md).

## Adapter examples

| Example | Demonstrates |
| --- | --- |
| [08-langchain-adapter](08-langchain-adapter) | LangChain `BaseCallbackHandler` → in-memory by default; optional `persist: true` JSONL (v0.5) |

Install and run from the **repository root**:

```bash
pnpm install
pnpm --filter agent-inspect-example-08-langchain-adapter start
```

## Inspect traces (CLI)

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
