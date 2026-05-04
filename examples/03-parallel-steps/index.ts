/**
 * Travel context: three step.tool() calls in Promise.all share the same
 * parent step ID in the trace, then merge-context runs after they finish.
 */
import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const context = await inspectRun(
  "travel-context",
  async () => {
    return step("collect-context", async () => {
      const [weather, events, hotelPrices] = await Promise.all([
        step.tool("fetchWeather", async () => {
          await delay(18);

          return { tempC: 22, condition: "sunny" };
        }),

        step.tool("fetchEvents", async () => {
          await delay(12);

          return [{ name: "Jazz night" }, { name: "Food market" }];
        }),

        step.tool("fetchHotelPrices", async () => {
          await delay(9);

          return [{ hotelId: "h1", nightlyRate: 120 }];
        }),
      ]);

      return step("merge-context", async () => {
        await delay(5);

        return { weather, events, hotelPrices };
      });
    });
  },
  { silent },
);

console.log("\nMerged context:", context);
console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view run_abc123");
