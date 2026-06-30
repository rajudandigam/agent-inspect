import { inspectRun, step } from "agent-inspect";

await inspectRun(
  "ci-eval-redact-starter",
  async () => {
    await step.tool("lookup", async () => ({ ok: true }));
  },
  { traceDir: ".agent-inspect", silent: true },
);
console.log("Trace written. Next:");
console.log("  npx agent-inspect check .agent-inspect/*.jsonl");
console.log("  npx agent-inspect redact .agent-inspect/*.jsonl --profile share -o safe.jsonl");
