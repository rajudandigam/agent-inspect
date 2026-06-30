import { inspectRun, step } from "agent-inspect";

await inspectRun(
  "openai-agents-starter",
  async () => {
    await step.tool("mock-agent", async () => "ok");
  },
  { traceDir: ".agent-inspect", silent: true },
);
console.log("Trace written to .agent-inspect/");
console.log("Use @agent-inspect/openai-agents processors for local-only tracing.");
