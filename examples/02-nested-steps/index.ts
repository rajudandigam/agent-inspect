/**
 * Nested execution tree: parent `plan-trip` wraps LLM-shaped and tool-shaped steps.
 * Open the trace to see hierarchy instead of flattening everything into logs.
 */
import { inspectRun, step } from "agent-inspect";

function delay(ms: number): Promise<void> {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
}

await inspectRun(
  "trip-planner",
  async () => {
    await step("plan-trip", async () => {
      await step.llm("mock-gpt", async () => {
        await delay(12);
        return "Plan: visit museum, dinner, walk.";
      });
      await step("parse-plan", async () => {
        await delay(8);
        return ["museum", "dinner", "walk"];
      });
      await step.tool("searchHotels", async () => {
        await delay(10);
        return [{ id: "h1", city: "Kyoto" }];
      });
      await step("finalize", async () => {
        await delay(6);
        return "itinerary-saved";
      });
    });
  },
  { silent: true },
);

console.log("Done. Inspect: agent-inspect list && agent-inspect view <run-id>");
