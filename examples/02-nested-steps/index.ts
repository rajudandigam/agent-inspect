/**
 * Trip planner: nested LLM + parse under plan-trip, then tool + finalize
 * as root-level sibling steps so parent/child vs siblings is obvious.
 */
import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const result = await inspectRun(
  "trip-planner",
  async () => {
    const plan = await step("plan-trip", async () => {
      const draft = await step.llm("mock-gpt", async () => {
        await delay(12);
        return "Plan: museum, dinner, evening walk.";
      });

      return step("parse-plan", async () => {
        await delay(8);
        return draft
          .replace("Plan: ", "")
          .split(", ")
          .map((item) => item.trim());
      });
    });

    const hotels = await step.tool("searchHotels", async () => {
      await delay(10);
      return [{ id: "h1", city: "Kyoto" }];
    });

    return step("finalize", async () => {
      await delay(6);
      return { plan, hotel: hotels[0] ?? null };
    });
  },
  { silent },
);

console.log("\nTrip plan:", result);
console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view run_abc123");
