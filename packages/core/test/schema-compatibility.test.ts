import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  isAgentInspectTrace,
  readTraceEvents,
} from "../src/entries/advanced.js";
import {
  diffTraceEvents,
  manualTraceEventsToComparableRun,
} from "../src/entries/diff.js";
import {
  exportRunTree,
  manualTraceEventsToRunTree,
} from "../src/entries/exporters.js";
import { parseTraceJsonl } from "../src/read-trace.js";
import { validateEvent } from "../src/storage.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixturesTraceDir = path.join(repoRoot, "fixtures/traces");
const fixturesTraceV10Dir = path.join(repoRoot, "fixtures/traces-v1.0");

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

describe("schema compatibility (v1.0 JSONL traces)", () => {
  it("reads stable persisted fixtures without losing extension fields", async () => {
    const raw = await readFile(
      path.join(fixturesTraceV10Dir, "manual-basic.jsonl"),
      "utf-8",
    );
    const parsed = parseTraceJsonl(raw, { validate: validateEvent });

    expect(parsed.format).toBe("1.0");
    expect(parsed.events.some((event) => event.event === "run_started")).toBe(true);
    expect(
      parsed.persisted.find((event) => event.eventId === "logic_1") as Record<
        string,
        unknown
      >,
    ).toMatchObject({
      stableExtension: { fixture: "unknown-optional-field" },
    });
  });
});
