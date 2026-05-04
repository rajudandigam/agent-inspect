/**
 * Travel context: under `collect-context`, three tools run in parallel (`Promise.all`),
 * then `merge-context` runs as a sequential child—same parent as the parallel siblings.
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
        return {
          status: "merged",
          note: "Combined parallel tool results (see trace for each tool step).",
        };
      });
    });
  },
  { silent },
);

console.log("\nMerged context:", summary);
console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view <run-id>");
