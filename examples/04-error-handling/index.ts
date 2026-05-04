/**
 * Pricing flow: one step throws.
 * AgentInspect records the failed step and rethrows the original error.
 */
import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

try {
  await inspectRun(
    "pricing-flow",
    async () => {
      await step("load-catalog", async () => {
        await delay(8);

        return ["sku-a", "sku-b"];
      });

      await step("fetch-dynamic-pricing", async () => {
        await delay(10);

        throw new Error("Pricing API timeout");
      });

      await step("apply-discount", async () => {
        await delay(5);

        return "this step should not run";
      });
    },
    { silent },
  );
} catch {
  console.log("\nPricing flow failed as expected.");
  console.log(
    "The original error still propagated, and AgentInspect recorded the failed step.",
  );
  console.log("\nNext:");
  console.log("  agent-inspect list");
  console.log("  agent-inspect view run_abc123");
}
