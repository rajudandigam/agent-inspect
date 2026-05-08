import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { manualTraceEventsToComparableRun } from "../../src/diff/comparable.js";
import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";
import { readTraceEvents } from "../../src/storage.js";
import type { TraceEvent } from "../../src/types.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function loadFixtureTrace(rel: string): TraceEvent[] {
  const abs = path.join(repoRoot, rel);
  const lines = fs.readFileSync(abs, "utf8").split(/\r?\n/).filter((l) => l.trim() !== "");
  return lines.map((l) => JSON.parse(l) as TraceEvent);
}

describe("v0.1 trace compatibility", () => {
  it("fixture traces remain readable via core validation path", async () => {
    const dir = path.join(repoRoot, "fixtures/traces");
    const events = await readTraceEvents("minimal-success", dir);
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e) => e.event === "run_started")).toBe(true);
    expect(events.some((e) => e.event === "step_completed")).toBe(true);
  });

  it("step_completed with status error represents failures", () => {
    const events = loadFixtureTrace("fixtures/traces/minimal-error.jsonl");
    const completed = events.filter((e) => e.event === "step_completed");
    expect(completed.some((e) => e.event === "step_completed" && e.status === "error")).toBe(true);
  });

  it("manualTraceEventsToRunTree accepts fixture traces", () => {
    const events = loadFixtureTrace("fixtures/traces/nested-3-levels.jsonl");
    const tree = manualTraceEventsToRunTree(events);
    expect(tree.runId).toBe("nested-3-levels");
    expect(tree.children.length).toBeGreaterThan(0);
  });

  it("manualTraceEventsToComparableRun accepts fixture traces", () => {
    const events = loadFixtureTrace("fixtures/traces/parallel-siblings.jsonl");
    const c = manualTraceEventsToComparableRun(events);
    expect(c.steps.length).toBe(3);
  });
});
