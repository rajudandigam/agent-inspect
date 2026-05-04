/**
 * Promise.all sibling steps share one parent; AsyncLocalStorage keeps parent ids correct
 * (see trace: parallel tools each have the same parentId, no crossed wires).
 */
import { inspectRun, step } from "agent-inspect";

function delay(ms: number): Promise<void> {
  return new Promise((r) => {
    setTimeout(r, ms);
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
  { silent: true },
);

console.log("Done. Inspect: agent-inspect list && agent-inspect view <run-id>");
