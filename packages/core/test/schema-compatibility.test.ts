import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  diffTraceEvents,
  exportRunTree,
  isAgentInspectTrace,
  manualTraceEventsToComparableRun,
  manualTraceEventsToRunTree,
  readTraceEvents,
} from "../src/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixturesTraceDir = path.join(repoRoot, "fixtures/traces");

describe("schema compatibility (v0.1 JSONL traces)", () => {
  it("reads minimal-success and minimal-error fixtures", async () => {
    const ok = await readTraceEvents("minimal-success", fixturesTraceDir);
    const err = await readTraceEvents("minimal-error", fixturesTraceDir);
    expect(ok.some((e) => e.event === "run_started")).toBe(true);
    expect(ok.some((e) => e.event === "run_completed")).toBe(true);
    expect(err.some((e) => e.event === "run_started")).toBe(true);
    expect(err.some((e) => e.event === "run_completed")).toBe(true);
  });

  it("accepts stable event names and no step_failed assumption", async () => {
    const events = await readTraceEvents("minimal-error", fixturesTraceDir);
    const names = new Set(events.map((e) => e.event));
    expect(names.has("run_started")).toBe(true);
    expect(names.has("run_completed")).toBe(true);
    expect(names.has("step_started")).toBe(true);
    expect(names.has("step_completed")).toBe(true);
    expect(names.has("step_failed" as any)).toBe(false);
  });

  it("represents failures via step_completed status=error", async () => {
    const events = await readTraceEvents("minimal-error", fixturesTraceDir);
    const failed = events.find((e) => e.event === "step_completed" && e.status === "error");
    expect(failed).toBeDefined();
  });

  it("isAgentInspectTrace recognizes valid fixture traces", async () => {
    await expect(
      isAgentInspectTrace(path.join(fixturesTraceDir, "minimal-success.jsonl")),
    ).resolves.toBe(true);
  });

  it("manualTraceEventsToRunTree consumes fixtures", async () => {
    const events = await readTraceEvents("minimal-success", fixturesTraceDir);
    const tree = manualTraceEventsToRunTree(events);
    expect(tree.runId).toBe("minimal-success");
    expect(tree.status).toBe("ok");
  });

  it("manualTraceEventsToComparableRun consumes fixtures", async () => {
    const events = await readTraceEvents("minimal-success", fixturesTraceDir);
    const comparable = manualTraceEventsToComparableRun(events);
    expect(comparable.runId).toBe("minimal-success");
    expect(comparable.status).toBe("success");
  });

  it("exportRunTree can export fixture-derived tree", async () => {
    const events = await readTraceEvents("minimal-success", fixturesTraceDir);
    const tree = manualTraceEventsToRunTree(events);
    const exported = exportRunTree(tree, { format: "markdown" });
    expect(exported.format).toBe("markdown");
    expect(exported.content).toContain("AgentInspect Run");
  });

  it("diffTraceEvents can diff fixture traces", async () => {
    const left = await readTraceEvents("minimal-success", fixturesTraceDir);
    const right = await readTraceEvents("minimal-error", fixturesTraceDir);
    const diff = diffTraceEvents(left, right, { ignoreDuration: true });
    expect(diff.summary.totalDifferences).toBeGreaterThanOrEqual(1);
  });
});

