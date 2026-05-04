# AgentInspect examples

Runnable **MVP** samples (local-only, no API keys, no external LLM SDKs).

| Example | Demonstrates |
|--------|----------------|
| [01-basic](01-basic) | `inspectRun` + `step` |
| [02-nested-steps](02-nested-steps) | Execution tree hierarchy |
| [03-parallel-steps](03-parallel-steps) | `Promise.all` sibling isolation |
| [04-error-handling](04-error-handling) | Failed steps and error traces |
| [05-observe-wrapper](05-observe-wrapper) | Proxy wrapper for agent-like objects |

Post-MVP and integration ideas are listed in [docs/EXAMPLES_ROADMAP.md](../docs/EXAMPLES_ROADMAP.md) (docs only — not implemented here).

## How to run

### 1. Build the library (repo root)

```bash
pnpm build
```

### 2. Run one example

```bash
cd examples/01-basic
pnpm install
pnpm start
```

### 3. Inspect traces

From the example directory:

```bash
node ../../packages/cli/dist/index.cjs list
node ../../packages/cli/dist/index.cjs view <run-id>
```

## Terminal output

By default, examples show AgentInspect **terminal** output (runs and steps). For CI or quiet runs:

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## Workspace note

These folders are part of the pnpm workspace. From the repo root, `pnpm install` links `agent-inspect` and example dependencies (including `tsx`).
