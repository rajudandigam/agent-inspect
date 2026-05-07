import { describe, expect, it } from "vitest";

import type {
  AttributionConfidence,
  EventSource,
  InspectEvent,
  InspectKind,
} from "../../src/types/inspect-event.js";

describe("v0.3 InspectEvent types", () => {
  it("allows all InspectKind literals", () => {
    const kinds: InspectKind[] = [
      "RUN",
      "AGENT",
      "LLM",
      "TOOL",
      "CHAIN",
      "RETRIEVER",
      "DECISION",
      "RESULT",
      "ERROR",
      "LOGIC",
      "LOG",
    ];
    expect(kinds).toHaveLength(11);
  });

  it("allows all AttributionConfidence literals", () => {
    const conf: AttributionConfidence[] = [
      "explicit",
      "correlated",
      "heuristic",
      "unknown",
    ];
    expect(conf).toHaveLength(4);
  });

  it("preserves source type and minimal event shape", () => {
    const source: EventSource = { type: "json-log", file: "x.log", line: 10 };
    const e: InspectEvent = {
      eventId: "evt_1",
      runId: "run_1",
      name: "tool:search",
      kind: "TOOL",
      timestamp: 1_700_000_000_000,
      confidence: "correlated",
      source,
    };
    expect(e.source.type).toBe("json-log");
  });
});

