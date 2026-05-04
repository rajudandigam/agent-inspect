# AgentInspect examples

These are runnable **MVP** examples. They use fake async delays only: **no API keys**, **no external LLM SDKs**, and **no network calls**.

| Example | Demonstrates |
|--------|----------------|
| [01-basic](01-basic) | `inspectRun` + `step` |
| [02-nested-steps](02-nested-steps) | Execution tree hierarchy |
| [03-parallel-steps](03-parallel-steps) | `Promise.all` sibling isolation |
| [04-error-handling](04-error-handling) | Failed steps and error traces |
| [05-observe-wrapper](05-observe-wrapper) | Proxy wrapper for agent-like objects |

## Run instructions

### 1. Build the library (repo root)

```bash
pnpm build
```

### 2. Run an example

```bash
cd examples/01-basic
pnpm install
pnpm start
```

### 3. Inspect traces

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```

## Terminal output

Examples show AgentInspect **terminal** output by default (runs and steps).

For quiet runs:

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## Advanced / post-MVP

Curated **docs-only** ideas (no runnable packages 06+ in v0.1): [docs/EXAMPLES_ROADMAP.md](../docs/EXAMPLES_ROADMAP.md). Those items are intentionally **post-MVP** and must not expand the v0.1 dependency surface.
