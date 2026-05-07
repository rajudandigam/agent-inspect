import { describe, expect, it } from "vitest";

import { TreeBuilder } from "../../src/logs/tree-builder.js";
import type { InspectEvent } from "../../src/types/inspect-event.js";

function e(partial: Partial<InspectEvent> & Pick<InspectEvent, "eventId" | "runId" | "name" | "kind" | "timestamp" | "confidence" | "source">): InspectEvent {
  return {
    status: undefined,
    durationMs: undefined,
    attributes: undefined,
    parentId: undefined,
    ...partial,
  };
}

describe("TreeBuilder", () => {
  it("groups by runId and sorts by timestamp", () => {
    const b = new TreeBuilder();
    const events: InspectEvent[] = [
      e({ eventId: "2", runId: "r", name: "b", kind: "LOG", timestamp: 2, confidence: "correlated", source: { type: "json-log" } }),
      e({ eventId: "1", runId: "r", name: "a", kind: "LOG", timestamp: 1, confidence: "correlated", source: { type: "json-log" } }),
    ];
    const trees = b.build(events);
    expect(trees).toHaveLength(1);
    expect(trees[0]!.children[0]!.event.name).toBe("a");
  });

  it("nests only with explicit parentId", () => {
    const b = new TreeBuilder();
    const parent = e({ eventId: "p", runId: "r", name: "p", kind: "AGENT", timestamp: 1, confidence: "explicit", source: { type: "json-log" } });
    const child = e({ eventId: "c", runId: "r", parentId: "p", name: "c", kind: "TOOL", timestamp: 2, confidence: "explicit", source: { type: "json-log" } });
    const trees = b.build([child, parent]);
    expect(trees[0]!.children).toHaveLength(1);
    expect(trees[0]!.children[0]!.children[0]!.event.name).toBe("c");
  });

  it("unresolved parent stays at root", () => {
    const b = new TreeBuilder();
    const child = e({ eventId: "c", runId: "r", parentId: "missing", name: "c", kind: "TOOL", timestamp: 1, confidence: "explicit", source: { type: "json-log" } });
    const trees = b.build([child]);
    expect(trees[0]!.children).toHaveLength(1);
  });
});

