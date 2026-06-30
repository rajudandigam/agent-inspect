import { createFixtureRunner, defineTarget } from "@agent-inspect/harness";

/** Minimal Nest-like app shape without Nest dependencies. */
function createMockNestApp() {
  const providers = new Map([
    [
      "SupportAgent",
      {
        async run(input) {
          return { answer: `Nest-style: ${input.question}` };
        },
      },
    ],
  ]);
  return {
    get(token) {
      const provider = providers.get(token);
      if (!provider) throw new Error(`Unknown provider: ${token}`);
      return provider;
    },
    async close() {},
  };
}

await createFixtureRunner({
  name: "harness-nestjs-starter",
  trace: { mode: "run", enabled: true, traceDir: ".agent-inspect", silent: true },
  bootstrap: async () => createMockNestApp(),
  shutdown: async (app) => {
    await app?.close?.();
  },
  targets: {
    support: defineTarget({
      description: "Mock Nest provider run",
      resolve: (app) => app.get("SupportAgent"),
      invoke: (agent, input) => agent.run(input),
    }),
  },
}).runFromArgv(["support", "--fixture", "fixtures/input.json"]);
