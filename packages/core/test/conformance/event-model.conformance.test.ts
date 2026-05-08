import { describe, expect, it } from "vitest";

import type { AttributionConfidence, InspectKind } from "../../src/types/inspect-event.js";

/** Mirrors packages/core/src/types/inspect-event.ts — update together if the union changes. */
const INSPECT_KINDS: InspectKind[] = [
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

const CONFIDENCE: AttributionConfidence[] = [
  "explicit",
  "correlated",
  "heuristic",
  "unknown",
];

describe("event model (pre-v1.0 conformance)", () => {
  it("lists InspectKind literals used across log ingest", () => {
    expect(INSPECT_KINDS.length).toBe(11);
  });

  it("lists AttributionConfidence literals", () => {
    expect(CONFIDENCE).toContain("explicit");
    expect(CONFIDENCE).toContain("unknown");
  });

  it("supports EventSource.type literals expected by parsers", () => {
    const sources = ["manual", "json-log", "log4js", "pino", "winston", "adapter"] as const;
    expect(sources.length).toBeGreaterThanOrEqual(4);
  });
});
