import { describe, expect, it } from "vitest";

import type { TraceEvent } from "../../src/types.js";

import { exportHtml } from "../../src/exporters/html-exporter.js";
import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";

function mini(): TraceEvent[] {
  return [
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "run_html",
      name: "h",
      startTime: 1,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 10,
      runId: "run_html",
      stepId: "s1",
      name: "bad",
      type: "logic",
      startTime: 10,
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 20,
      runId: "run_html",
      stepId: "s1",
      status: "error",
      endTime: 20,
      durationMs: 10,
      error: { message: "<oops>" },
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 30,
      runId: "run_html",
      status: "error",
      endTime: 30,
      durationMs: 29,
    },
  ];
}

describe("exportHtml", () => {
  it("single-file HTML with doctype", () => {
    const tree = manualTraceEventsToRunTree(mini());
    const r = exportHtml(tree);
    expect(r.content.toLowerCase()).toContain("<!doctype html");
    expect(r.contentType).toBe("text/html");
    expect(r.fileExtension).toBe(".html");
    expect(r.content).toContain("Execution tree");
    expect(r.content).toContain("Errors");
    expect(r.content).toContain("&lt;oops&gt;");
    expect(r.content.toLowerCase()).not.toContain("<script");
    expect(r.content.toLowerCase()).not.toContain("http://");
    expect(r.content.toLowerCase()).not.toContain("https://");
  });

  it("includes attrs only when requested", () => {
    const tree = manualTraceEventsToRunTree(mini());
    expect(exportHtml(tree).content).not.toContain("Attributes (bounded)");
    expect(exportHtml(tree, { includeAttributes: true }).content).toContain("Attributes");
  });
});
