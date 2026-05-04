/**
 * When a step throws, the trace records `step_completed` with status error and the run fails,
 * while the original Error object propagates — inspect the JSONL instead of losing context.
 */
import { inspectRun, step } from "agent-inspect";

function delay(ms: number): Promise<void> {
  return new Promise((r) => {
    setTimeout(r, ms);
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
    { silent: true },
  );
} catch {
  console.error(
    "Pricing flow failed (expected). Run `agent-inspect list` and `agent-inspect view <run-id>` to inspect the trace.",
  );
}
