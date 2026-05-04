/**
 * Travel context: three tools run in parallel under one parent, then a merge step
 * runs in the same parent after `Promise.all` completes.
 */
import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const merged = await inspectRun(
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
        return {
          status: "merged",
          note: "See trace: three tool siblings share parentId, merge is a later child.",
        };
      });
    });
  },
  { silent },
);

console.log("\nMerged context:", merged);
console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view <run-id>");
