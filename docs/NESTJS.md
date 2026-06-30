# NestJS + AgentInspect (harness path)

AgentInspect does **not** ship a production NestJS interceptor in v3.2. Use **`@agent-inspect/harness`** to bootstrap real Nest apps for local fixture runs.

## Recommended path (v3.2)

1. `npx agent-inspect init` or use [examples/starters/harness-nestjs](../examples/starters/harness-nestjs/)
2. Wire `createFixtureRunner()` with your `TestingModule` / app bootstrap
3. Run targets with JSON fixtures — no real model calls by default

```ts
import { createFixtureRunner, defineTarget } from "@agent-inspect/harness";

await createFixtureRunner({
  name: "nestjs-support",
  trace: { mode: "run-if-enabled", traceDir: ".agent-inspect" },
  bootstrap: async () => {
    const moduleRef = await Test.createTestingModule({ /* ... */ }).compile();
    return moduleRef.createNestApplication();
  },
  shutdown: async (app) => {
    await app?.close?.();
  },
  targets: {
    ask: defineTarget({
      resolve: (app) => app.get(SupportAgent),
      invoke: (agent, input) => agent.run(input),
    }),
  },
}).runFromArgv();
```

## Out of scope (v3.2)

- `@agent-inspect/nestjs` production package (demand-gated)
- Redis/SQS mocking in harness
- Global monkey-patching of Nest providers

## Structured logs alternative

If you only need log ingestion, see [examples/recipes/nestjs-json-logging](../examples/recipes/nestjs-json-logging/).

## Related

- [HARNESS.md](./HARNESS.md)
- [examples/starters/harness-nestjs](../examples/starters/harness-nestjs/)
