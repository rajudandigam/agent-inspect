import { inspectRun, step } from "agent-inspect";

await inspectRun(
  "broken-agent-fixed",
  async () => {
    await step.tool("refund_policy", async () => ({ policy: "30-day returns" }));
  },
  { traceDir: ".agent-inspect", silent: true },
);

console.log("Fixed trace written. Compare with diff.");
