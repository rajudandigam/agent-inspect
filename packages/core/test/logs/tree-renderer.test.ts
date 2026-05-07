import { describe, expect, it } from "vitest";

import { renderRunTree } from "../../src/logs/tree-renderer.js";
import type { InspectRunTree } from "../../src/types/inspect-event.js";

describe("tree renderer", () => {
  it("renders run header and summary", () => {
    const tree: InspectRunTree = {
      runId: "r1",
      children: [],
      metadata: {
        totalEvents: 0,
        confidenceBreakdown: { explicit: 0, correlated: 0, heuristic: 0, unknown: 0 },
        kinds: { LOG: 0 } as any,
      },
    };
    const out = renderRunTree(tree, { summary: true });
    expect(out).toContain("Run r1");
    expect(out).toContain("Summary:");
  });

  it("renders flat timeline and confidence labels", () => {
    const tree: InspectRunTree = {
      runId: "r",
      children: [
        {
          depth: 0,
          event: {
            eventId: "e1",
            runId: "r",
            name: "tool:x",
            kind: "TOOL",
            timestamp: 1,
            confidence: "correlated",
            source: { type: "json-log" },
            attributes: { jobId: "abcdef0123" },
          },
          children: [],
        },
      ],
      metadata: {
        totalEvents: 1,
        confidenceBreakdown: { explicit: 0, correlated: 1, heuristic: 0, unknown: 0 },
        kinds: { TOOL: 1 } as any,
      },
    };
    const out = renderRunTree(tree, { summary: false, showConfidence: "always" });
    expect(out).toContain("tool:x");
    expect(out).toContain("confidence:");
  });
});

