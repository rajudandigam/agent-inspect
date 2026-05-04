/**
 * Trip planner: nested work under `plan-trip`, then tool + finalize at the run root.
 */
import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const outcome = await inspectRun(
  "trip-planner",
  async () => {
    await step("plan-trip", async () => {
      await step.llm("mock-gpt", async () => {
        await delay(12);
        return "Plan: museum, dinner, walk.";
      });
      await step("parse-plan", async () => {
        await delay(8);
        return ["museum", "dinner", "walk"];
      });
    });

    await step.tool("searchHotels", async () => {
      await delay(10);
      return [{ id: "h1", city: "Kyoto" }];
    });

    return step("finalize", async () => {
      await delay(6);
      return "itinerary-ready";
    });
  },
  { silent },
);

console.log("\nResult:", outcome);
console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view <run-id>");
