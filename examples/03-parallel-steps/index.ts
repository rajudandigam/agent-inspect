/**
 * Travel context: three `step.tool` calls in `Promise.all` share the same parent step id
 * in the trace (siblings), then `merge-context` runs sequentially after they finish.
 */
import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

await inspectRun(
  "travel-context",
  async () => {
    await step("collect-context", async () => {
      await Promise.all([
        step.tool("fetchWeather", async () => {
          await delay(18);
          return { tempC: 22 };
        }),
        step.tool("fetchEvents", async () => {
          await delay(12);
          return [{ name: "Jazz night" }];
        }),
        step.tool("fetchHotelPrices", async () => {
          await delay(9);
          return [{ night: 120 }];
        }),
      ]);
      await step("merge-context", async () => {
        await delay(5);
        return "merged";
      });
    });
  },
  { silent },
);

console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view <run-id>");
