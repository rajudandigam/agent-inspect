import { inspectRun, step } from "agent-inspect";

await inspectRun(
  "broken-agent-debug",
  async () => {
    // Intentionally calls the wrong tool (fixture — no real APIs)
    await step.tool("search_docs", async () => {
      throw new Error("Wrong tool: expected refund_policy lookup");
    });
  },
  { traceDir: ".agent-inspect", silent: true },
);

console.log("Broken trace written to .agent-inspect/");
console.log("  npx agent-inspect report <run-id> --dir .agent-inspect");
console.log("  npx agent-inspect check .agent-inspect/*.jsonl");
