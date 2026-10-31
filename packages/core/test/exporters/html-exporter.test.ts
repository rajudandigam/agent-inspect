import { describe, expect, it } from "vitest";

import type { TraceEvent } from "../../src/types.js";

import { exportHtml } from "../../src/exporters/html-exporter.js";
import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";
import { traceEventsToPersistedRunTrees } from "../../src/persisted/tree-bridge.js";

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

  it("joins sibling start/complete rows so completed steps are not shown as running", () => {
    const events: TraceEvent[] = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "run_html_life",
        name: "lifecycle",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 10,
        runId: "run_html_life",
        stepId: "step_root",
        name: "plan",
        type: "logic",
        startTime: 10,
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: 20,
        runId: "run_html_life",
        stepId: "step_root",
        status: "success",
        endTime: 20,
        durationMs: 10,
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 30,
        runId: "run_html_life",
        status: "success",
        endTime: 30,
        durationMs: 29,
      },
    ];

    const raw = traceEventsToPersistedRunTrees(events)[0]!;
    // Control: raw bridge still retains running start rows beside completions.
    const rawStatuses = raw.children.map((n) => n.event.status);
    expect(rawStatuses).toContain("running");
    expect(rawStatuses).toContain("ok");

    const html = exportHtml(raw).content;
    const treeSection =
      html.match(/<section class="tree">[\s\S]*?<\/section>/)?.[0] ?? "";
    expect(treeSection).toContain("plan");
    expect(treeSection).toMatch(/\[LOGIC\] ok/);
    expect(treeSection).not.toMatch(/\[LOGIC\] running/);
    expect(treeSection).not.toMatch(/\[RUN\] running/);
    expect(treeSection).toMatch(/\[RUN\] ok/);
    // Original tree unchanged.
    expect(raw.children.some((n) => n.event.status === "running")).toBe(true);
  });

  it("keeps missing completion as running and conflicting completions distinct", () => {
    const incomplete: TraceEvent[] = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "run_incomplete",
        name: "open",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 10,
        runId: "run_incomplete",
        stepId: "s1",
        name: "hang",
        type: "tool",
        startTime: 10,
      },
    ];
    const incompleteHtml = exportHtml(traceEventsToPersistedRunTrees(incomplete)[0]!).content;
    expect(incompleteHtml).toMatch(/\[TOOL\] running/);

    const conflictTree = traceEventsToPersistedRunTrees([
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "run_conflict",
        name: "c",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 10,
        runId: "run_conflict",
        stepId: "s1",
        name: "dup",
        type: "tool",
        startTime: 10,
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: 20,
        runId: "run_conflict",
        stepId: "s1",
        status: "success",
        endTime: 20,
        durationMs: 10,
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: 21,
        runId: "run_conflict",
        stepId: "s1",
        status: "error",
        endTime: 21,
        durationMs: 11,
        error: { message: "conflict" },
      },
    ])[0]!;
    // Force both terminals into one sibling group for the presentation diagnostic.
    const forced = {
      ...conflictTree,
      children: conflictTree.children.filter((n) => n.event.kind !== "RUN" || n.event.status !== "running"),
    };
    const stepNodes = forced.children.filter((n) => n.event.attributes?.stepId === "s1");
    expect(stepNodes.length).toBeGreaterThanOrEqual(2);
    const html = exportHtml({
      ...forced,
      children: stepNodes,
    }).content;
    expect(html).toMatch(/ok/);
    expect(html).toMatch(/error/);
  });

  it("preserves distinct attempts that share a stepId, including a later running attempt", () => {
    const tree = traceEventsToPersistedRunTrees([
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "run_attempts",
        name: "attempts",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 10,
        runId: "run_attempts",
        stepId: "shared_step",
        name: "call",
        type: "tool",
        startTime: 10,
        metadata: { attemptId: "a1" },
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: 20,
        runId: "run_attempts",
        stepId: "shared_step",
        status: "error",
        endTime: 20,
        durationMs: 10,
        error: { message: "429" },
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 30,
        runId: "run_attempts",
        stepId: "shared_step",
        name: "call",
        type: "tool",
        startTime: 30,
        metadata: { attemptId: "a2" },
      },
    ])[0]!;

    const html = exportHtml(tree).content;
    const treeSection =
      html.match(/<section class="tree">[\s\S]*?<\/section>/)?.[0] ?? "";
    // Joined a1 completion + preserved a2 running (not collapsed into one node).
    expect(treeSection).toMatch(/error/);
    expect(treeSection).toMatch(/\[TOOL\] running/);
    const statusHits = [...treeSection.matchAll(/\[(?:TOOL|LOGIC)\] (?:ok|error|running)/g)];
    expect(statusHits.length).toBeGreaterThanOrEqual(2);
  });
});
