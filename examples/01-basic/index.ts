/**
 * Basic hotel booking flow: each `step()` becomes a node in the execution tree
 * (visible with `agent-inspect list` / `view`) instead of ad-hoc console.log noise.
 */
import { inspectRun, step } from "agent-inspect";

function delay(ms: number): Promise<void> {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
}

async function searchHotels(city: string): Promise<string[]> {
  await delay(20);
  return [`${city}-Hotel-A`, `${city}-Hotel-B`];
}

async function checkAvailability(hotelId: string): Promise<{ hotelId: string; rooms: number }> {
  await delay(15);
  return { hotelId, rooms: hotelId.includes("A") ? 2 : 0 };
}

async function finalizeBooking(room: { hotelId: string; rooms: number }): Promise<string> {
  await delay(10);
  return `confirmed:${room.hotelId}`;
}

await inspectRun(
  "hotel-booking",
  async () => {
    const hotels = await step("search-hotels", () => searchHotels("Tokyo"));
    const room = await step("check-availability", () => checkAvailability(hotels[0]!));
    return step("finalize-booking", () => finalizeBooking(room));
  },
  { silent: true },
);

console.log("Done. Inspect traces: agent-inspect list && agent-inspect view <run-id>");
