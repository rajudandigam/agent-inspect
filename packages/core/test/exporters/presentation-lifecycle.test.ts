import { describe, expect, it } from "vitest";

import { presentLifecycleJoinedTree } from "../../src/exporters/presentation-lifecycle.js";
import type { InspectEvent, InspectNode, InspectRunTree } from "../../src/types/inspect-event.js";

function node(
  partial: Partial<InspectEvent> & Pick<InspectEvent, "eventId" | "name" | "status">,
  children: InspectNode[] = [],
): InspectNode {
  return {
    event: {
      runId: "run_x",
      kind: "TOOL",
      timestamp: 1,
      confidence: "explicit",
      source: { type: "manual" },
      ...partial,
    },
    children,
    depth: 0,
  };
}

function tree(children: InspectNode[]): InspectRunTree {
  return {
    runId: "run_x",
    children,
    metadata: {
      totalEvents: children.length,
      confidenceBreakdown: {
        explicit: children.length,
        correlated: 0,
        heuristic: 0,
        unknown: 0,
      },
      kinds: {
        RUN: 0,
        AGENT: 0,
        LLM: 0,
        TOOL: children.length,
        CHAIN: 0,
        RETRIEVER: 0,
        DECISION: 0,
        RESULT: 0,
        ERROR: 0,
        LOGIC: 0,
        LOG: 0,
        OUTCOME: 0,
      },
    },
  };
}

describe("presentLifecycleJoinedTree", () => {
  it("joins a single start/complete pair that shares stepId", () => {
    const presented = presentLifecycleJoinedTree(
      tree([
        node({
          eventId: "e1",
          name: "echo",
          status: "running",
          timestamp: 10,
          attributes: { stepId: "s1" },
        }),
        node({
          eventId: "e2",
          name: "echo",
          status: "ok",
          timestamp: 20,
          attributes: { stepId: "s1" },
        }),
      ]),
    );
    expect(presented.children).toHaveLength(1);
    expect(presented.children[0]!.event.status).toBe("ok");
  });

  it("keeps distinct attempts that share a stepId", () => {
    const presented = presentLifecycleJoinedTree(
      tree([
        node({
          eventId: "e1",
          name: "echo",
          status: "running",
          timestamp: 10,
          attributes: { stepId: "s1", attemptId: "a1" },
        }),
        node({
          eventId: "e2",
          name: "echo",
          status: "ok",
          timestamp: 20,
          attributes: { stepId: "s1", attemptId: "a1" },
        }),
        node({
          eventId: "e3",
          name: "echo",
          status: "running",
          timestamp: 30,
          attributes: { stepId: "s1", attemptId: "a2" },
        }),
      ]),
    );
    expect(presented.children).toHaveLength(2);
    expect(presented.children.map((n) => n.event.status).sort()).toEqual(["ok", "running"]);
  });

  it("does not collapse conflicting terminals that share a stepId without attemptId", () => {
    const presented = presentLifecycleJoinedTree(
      tree([
        node({
          eventId: "e1",
          name: "echo",
          status: "ok",
          timestamp: 20,
          attributes: { stepId: "s1" },
        }),
        node({
          eventId: "e2",
          name: "echo",
          status: "error",
          timestamp: 21,
          attributes: { stepId: "s1" },
        }),
      ]),
    );
    expect(presented.children).toHaveLength(2);
  });

  it("preserves a later running row after a completed pair when attempt identity is absent", () => {
    const presented = presentLifecycleJoinedTree(
      tree([
        node({
          eventId: "e1",
          name: "echo",
          status: "running",
          timestamp: 10,
          attributes: { stepId: "s1" },
        }),
        node({
          eventId: "e2",
          name: "echo",
          status: "ok",
          timestamp: 20,
          attributes: { stepId: "s1" },
        }),
        node({
          eventId: "e3",
          name: "echo",
          status: "running",
          timestamp: 30,
          attributes: { stepId: "s1" },
        }),
      ]),
    );
    expect(presented.children).toHaveLength(2);
    expect(presented.children.some((n) => n.event.status === "ok")).toBe(true);
    expect(presented.children.some((n) => n.event.status === "running")).toBe(true);
  });
});
