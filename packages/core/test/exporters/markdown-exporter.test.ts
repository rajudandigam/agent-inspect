import { describe, expect, it } from "vitest";

import type { TraceEvent } from "../../src/types.js";

import { exportMarkdown } from "../../src/exporters/markdown-exporter.js";
import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";

function mini(): TraceEvent[] {
  return [
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "run_md",
      name: "md-run",
      startTime: 1,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 10,
      runId: "run_md",
      stepId: "s1",
      name: "step|pipe\nline",
      type: "logic",
      startTime: 10,
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 20,
      runId: "run_md",
      stepId: "s1",
      status: "success",
      endTime: 20,
      durationMs: 10,
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 30,
      runId: "run_md",
      status: "success",
      endTime: 30,
      durationMs: 29,
    },
  ];
}

describe("exportMarkdown", () => {
  it("exports title and summary and tree", () => {
    const tree = manualTraceEventsToRunTree(mini());
    const r = exportMarkdown(tree);
    expect(r.format).toBe("markdown");
    expect(r.contentType).toBe("text/markdown");
    expect(r.fileExtension).toBe(".md");
    expect(r.content.startsWith("# AgentInspect Run:")).toBe(true);
    expect(r.content).toContain("run_md");
    expect(r.content).toContain("Execution tree");
    expect(r.content).toContain("\\|");
  });

  it("excludes attributes by default", () => {
    const tree = manualTraceEventsToRunTree(mini());
    const r = exportMarkdown(tree, { includeAttributes: false });
    expect(r.content).not.toContain("## Attributes");
  });

  it("includes attributes when requested", () => {
    const tree = manualTraceEventsToRunTree(mini());
    const r = exportMarkdown(tree, { includeAttributes: true });
    expect(r.content).toContain("Attributes (bounded)");
  });

  it("bounded long safeString paths via compact", () => {
    const events = [...mini()];
    const tree = manualTraceEventsToRunTree(events);
    const r = exportMarkdown(tree, { includeAttributes: true, maxAttributeLength: 5 });
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
