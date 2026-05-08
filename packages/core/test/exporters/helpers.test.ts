import { describe, expect, it } from "vitest";

import type { InspectRunTree } from "../../src/types/inspect-event.js";
import {
  compactAttributes,
  escapeHtml,
  escapeMarkdown,
  flattenTree,
  safeString,
  stableJson,
  summarizeTree,
} from "../../src/exporters/helpers.js";

function minimalTree(): InspectRunTree {
  return {
    runId: "run_x",
    name: "t",
    status: "ok",
    startedAt: 1,
    endedAt: 2,
    durationMs: 1,
    children: [],
    metadata: {
      totalEvents: 0,
      confidenceBreakdown: {
        explicit: 0,
        correlated: 0,
        heuristic: 0,
        unknown: 0,
      },
      kinds: {
        RUN: 0,
        AGENT: 0,
        LLM: 0,
        TOOL: 0,
        CHAIN: 0,
        RETRIEVER: 0,
        DECISION: 0,
        RESULT: 0,
        ERROR: 0,
        LOGIC: 0,
        LOG: 0,
      },
    },
  };
}

describe("exporters/helpers", () => {
  it("escapes HTML", () => {
    expect(escapeHtml(`<&>"'`)).toBe("&lt;&amp;&gt;&quot;&#39;");
  });

  it("escapes markdown pipes and newlines", () => {
    expect(escapeMarkdown("a|b\nc")).toBe("a\\|b c");
  });

  it("stable JSON is deterministic", () => {
    expect(stableJson({ b: 1, a: 2 }, false)).toBe(stableJson({ a: 2, b: 1 }, false));
    expect(stableJson({ b: 1, a: 2 }, true)).toContain("\n");
  });

  it("truncates attributes", () => {
    const c = compactAttributes({ long: "x".repeat(100) }, { maxLength: 10, redacted: false });
    expect(String(c.long).length).toBeLessThanOrEqual(11);
  });

  it("flattenTree DFS order", () => {
    const tree = minimalTree();
    tree.children = [
      {
        depth: 0,
        event: {
          eventId: "a",
          runId: "run_x",
          name: "root",
          kind: "LOGIC",
          timestamp: 1,
          confidence: "explicit",
          source: { type: "manual" },
        },
        children: [
          {
            depth: 1,
            event: {
              eventId: "b",
              runId: "run_x",
              parentId: "a",
              name: "child",
              kind: "LOGIC",
              timestamp: 2,
              confidence: "explicit",
              source: { type: "manual" },
            },
            children: [],
          },
        ],
      },
    ];
    expect(flattenTree(tree).map((n) => n.event.eventId)).toEqual(["a", "b"]);
  });

  it("summarizeTree", () => {
    const s = summarizeTree(minimalTree());
    expect(s.runId).toBe("run_x");
  });

  it("does not mutate input attributes object when compacting copy", () => {
    const attrs = { x: 1 };
    compactAttributes(attrs, { redacted: false });
    expect(attrs).toEqual({ x: 1 });
  });

  it("safeString bounds", () => {
    expect(safeString("hello", 3)).toBe("hel…");
  });
});
