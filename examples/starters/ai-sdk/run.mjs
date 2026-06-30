import { inspectRun, step } from "agent-inspect";

await inspectRun(
  "ai-sdk-starter",
  async () => {
    await step.tool("mock-generate", async () => ({ text: "ok" }));
  },
  { traceDir: ".agent-inspect", silent: true },
);
console.log("Trace written to .agent-inspect/");
console.log("Wire @agent-inspect/ai-sdk telemetry in your real AI SDK app.");
