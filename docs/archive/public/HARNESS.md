# Harness (`@agent-inspect/harness`)

Local fixture runner for real TypeScript projects. Owns CLI arg parsing, target listing, JSON fixture/stdin loading, `observe()` / `inspectRun()` / `maybeInspectRun()` tracing, and graceful shutdown — not framework-specific bootstrapping.

## Install

```bash
npm install @agent-inspect/harness agent-inspect
```

## Quick start

```ts
import { createFixtureRunner, defineTarget } from "@agent-inspect/harness";

await createFixtureRunner({
  name: "support-agent",
  trace: { mode: "run-if-enabled", traceDir: ".agent-inspect" },
  bootstrap: async () => bootstrapAppForLocalAgentRun(),
  shutdown: async (app) => {
    await app.close?.();
  },
  targets: {
    refund: defineTarget({
      description: "Run refund policy agent",
      resolve: (app) => app.get(RefundPolicyAgent),
      invoke: (agent, input) => agent.run(input),
    }),
  },
}).runFromArgv();
```

## CLI

```bash
node ./runner.mjs --list
node ./runner.mjs refund --fixture fixtures/input.json
node ./runner.mjs refund --stdin --expected-output fixtures/expected.json
```

Options: `--trace`, `--no-trace`, `--trace-dir`, `--trace-mode off|run|run-if-enabled|observe`.

## Trace modes

| Mode | Behavior |
| ---- | -------- |
| `off` | No tracing |
| `run` | Always `inspectRun()` |
| `run-if-enabled` | `maybeInspectRun()` (default) — respects `AGENT_INSPECT` |
| `observe` | Wraps resolved target with `observe()` when enabled |

## Recipes

- [harness-basic](../../examples/recipes/harness-basic/)
- [harness-adapter-local](../../examples/recipes/harness-adapter-local/)

## Boundaries

Harness does **not** own Nest env vars, Redis/SQS mocking, real model calls, or framework DI. Keep bootstrap/shutdown in your app code.

See [ADAPTERS.md](./ADAPTERS.md) for framework adapters and [GETTING-STARTED.md](./GETTING-STARTED.md) for the init/doctor onboarding path (v3.1+).
