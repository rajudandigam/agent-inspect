/**
 * Hotel booking: the smallest useful inspectRun() + step() flow.
 * Each step() becomes a node in the execution tree.
 */
import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchHotels(city: string): Promise<string[]> {
  await delay(20);

  return [`${city}-Hotel-A`, `${city}-Hotel-B`];
}

async function checkAvailability(
  hotelId: string,
): Promise<{ hotelId: string; rooms: number }> {
  await delay(15);

  return { hotelId, rooms: hotelId.includes("A") ? 2 : 0 };
}

async function finalizeBooking(room: {
  hotelId: string;
  rooms: number;
}): Promise<string> {
  await delay(10);

  return `confirmed:${room.hotelId}`;
}

const confirmation = await inspectRun(
  "hotel-booking",
  async () => {
    const hotels = await step("search-hotels", () => searchHotels("Tokyo"));

    const room = await step("check-availability", () =>
      checkAvailability(hotels[0] ?? "unknown-hotel"),
    );

    return step("finalize-booking", () => finalizeBooking(room));
  },
  { silent },
);

console.log("\nBooking result:", confirmation);
console.log("\nNext:");
console.log("  agent-inspect list");
console.log("  agent-inspect view run_abc123");
