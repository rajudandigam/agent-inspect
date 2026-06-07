import { inspectRun, maybeInspectRun, step } from "agent-inspect";
import type { InspectRunOptions } from "agent-inspect";

const opts: InspectRunOptions = { silent: true, enabled: false };
void inspectRun;
void step;
void opts;

export async function smoke(): Promise<number> {
  return maybeInspectRun("ts-jest-node16", async () => 1, { enabled: false });
}
