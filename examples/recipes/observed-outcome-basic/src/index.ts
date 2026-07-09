import path from "node:path";

import { inspectRun, observeOutcome, step } from "agent-inspect";

const traceDir = path.join(process.cwd(), ".agent-inspect");

await inspectRun(
  "observed-outcome-demo",
  async () => {
    await step.tool("writeRow", async () => ({ ok: true }));
    await observeOutcome("rowVisible", {
      expectation: "Orders table contains row 42",
      status: "passed",
      method: "database",
      evidence: { table: "orders", id: "42" },
    });
    await observeOutcome("emailSent", {
      expectation: "Outbox contains receipt email",
      status: "failed",
      method: "queue",
      evidence: { queue: "outbox", messageType: "receipt" },
    });
  },
  { silent: true, traceDir },
);

console.log("Observed outcome recipe complete");
console.log(`Trace directory: ${traceDir}`);
console.log("Try:");
console.log("  npx agent-inspect search --dir ./.agent-inspect --observation failed");
