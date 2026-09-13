import { describe, expect, it } from "vitest";

import {
  SAMPLE_TRACE_FILENAME,
  SAMPLE_TRACE_RUN_ID,
  buildSampleTrace,
} from "../src/sampleTrace.js";

describe("vscode sample trace", () => {
  it("emits valid AgentInspect v0.1 JSONL for the sample run", () => {
    const lines = buildSampleTrace().trim().split("\n");
    const events = lines.map((line) => JSON.parse(line) as Record<string, unknown>);

    // Every event is on the sample run and uses the v0.1 schema.
    for (const event of events) {
      expect(event.schemaVersion).toBe("0.1");
      expect(event.runId).toBe(SAMPLE_TRACE_RUN_ID);
    }

    // A well-formed run: opens, has paired steps, and completes successfully.
    expect(events[0]?.event).toBe("run_started");
    expect(events.at(-1)).toMatchObject({ event: "run_completed", status: "success" });

    const started = events.filter((e) => e.event === "step_started");
    const completed = events.filter((e) => e.event === "step_completed");
    expect(started.length).toBe(completed.length);
    expect(started.length).toBeGreaterThan(0);

    // Includes an llm and a tool step so the sample shows a real tree.
    expect(started.some((e) => e.type === "llm")).toBe(true);
    expect(started.some((e) => e.type === "tool")).toBe(true);
  });

  it("uses a stable, self-describing filename and run id", () => {
    expect(SAMPLE_TRACE_FILENAME).toMatch(/\.jsonl$/);
    expect(SAMPLE_TRACE_FILENAME).toContain(SAMPLE_TRACE_RUN_ID);
  });
});
