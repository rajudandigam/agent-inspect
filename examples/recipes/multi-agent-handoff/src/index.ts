/**
 * Coordinator + mocked specialists (no LangChain / multi-runtime—plain functions).
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");

const summary = await inspectRun(
  "multi-agent-handoff-recipe",
  async () => {
    return step("orchestrate", async () => {
      const plan = await step("coordinator-plan", async () => "hotels + flights for fixture trip");

      const hotel = await step(
        "HotelAgent.run",
        async () => ({ hotelName: "Fixture Inn", city: "Kyoto" }),
        { metadata: { handoffTarget: "hotel-agent", phase: "specialist" } },
      );

      const flight = await step(
        "FlightAgent.run",
        async () => ({ flightNo: "FX-204", route: "NRT-KIX" }),
        { metadata: { handoffTarget: "flight-agent", phase: "specialist" } },
      );

      return step(
        "coordinator-finalize",
        async () => ({ plan, hotel, flight }),
        { metadata: { phase: "finalize" } },
      );
    });
  },
  { silent, traceDir, metadata: { recipe: "multi-agent-handoff" } },
);

console.log("\nHandoff summary:", summary);
console.log("\nNext:");
console.log("  npx agent-inspect view <run_id> --dir ./.agent-inspect-runs");
