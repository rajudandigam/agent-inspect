/**
 * Parallel step.tool calls share a parent — siblings in the tree, not nested hierarchy.
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const merged = await inspectRun(
  "parallel-tools-recipe",
  async () => {
    return step("parallel-batch", async () => {
      const [slowStock, fastFx] = await Promise.all([
        step.tool("slow-stock-quote", async () => {
          await delay(35);
          return { symbol: "FIX", price: 42 };
        }),
        step.tool("fast-fx-rate", async () => {
          await delay(5);
          return { pair: "USD/JPY", rate: 150.25 };
        }),
      ]);

      return { slowStock, fastFx };
    });
  },
  { silent, traceDir, metadata: { recipe: "parallel-tools" } },
);

console.log("\nParallel batch:", merged);
console.log("\nNext:");
console.log("  npx agent-inspect view <run_id> --dir ./.agent-inspect-runs");
console.log("  Expand parallel-batch: slow-stock-quote and fast-fx-rate should be siblings.");
