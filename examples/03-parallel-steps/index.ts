/**
 * Travel context: three parallel `step.tool` calls share the same parent step in the trace,
 * then `merge-context` runs after `Promise.all` settles.
 */
import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const summary = await inspectRun(
  "travel-context",
  async () => {
    return step("collect-context", async () => {
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

      return step("merge-context", async () => {
        await delay(5);
        return "merged";
      });
    });
  },
  { silent },
);

console.log("\nResult:", summary);
console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view <run-id>");
