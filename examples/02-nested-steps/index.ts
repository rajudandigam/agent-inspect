/**
 * Trip planner: nested steps under `plan-trip`, then a root-level `persist-itinerary`
 * so the trace shows both a subtree and a sibling at the run root.
 */
import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

await inspectRun(
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
      await step.tool("searchHotels", async () => {
        await delay(10);
        return [{ id: "h1", city: "Kyoto" }];
      });
      await step("finalize-inside-plan", async () => {
        await delay(6);
        return "draft-ready";
      });
    });

    // Outside `plan-trip`: second root-level step under the same run
    await step("persist-itinerary", async () => {
      await delay(5);
      return "saved";
    });
  },
  { silent },
);

console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view <run-id>");
