import { inspectRun, step } from "agent-inspect";

await inspectRun(
  "langchain-starter",
  async () => {
    await step.tool("mock-chain", async () => "ok");
  },
  { traceDir: ".agent-inspect", silent: true },
);
console.log("Trace written to .agent-inspect/");
console.log("Wire @agent-inspect/langchain callbacks in your LangChain app.");
