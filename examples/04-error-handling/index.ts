/**
 * Pricing flow: a step throws; the trace records `step_completed` + `run_completed` as error.
 * The original `Error` still propagates — we only catch outside `inspectRun` for the demo message.
 */
import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
      await step("apply-discount", async () => "never");
    },
    { silent },
  );
} catch {
  console.log("Pricing flow failed as expected.");
  console.log(
    "Run agent-inspect list and agent-inspect view <run-id> to inspect the trace.",
  );
}
