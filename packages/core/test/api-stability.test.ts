import { describe, expect, it } from "vitest";

import * as core from "../src/index.js";

describe("core API stability (v1.0 Pass 1)", () => {
  it("stable core APIs exist", () => {
    expect(typeof core.inspectRun).toBe("function");
    expect(typeof core.step).toBe("function");
    expect(typeof core.observe).toBe("function");
    expect(typeof (core.step as any).llm).toBe("function");
    expect(typeof (core.step as any).tool).toBe("function");
  });

  it("stable local inspection APIs exist", () => {
    expect(typeof core.TraceDirectory).toBe("function");
    expect(typeof core.resolveTraceDir).toBe("function");
    expect(typeof core.extractMetadata).toBe("function");
    expect(typeof core.buildRunSummary).toBe("function");
    expect(typeof core.filterTraces).toBe("function");
    expect(typeof core.isAgentInspectTrace).toBe("function");
    expect(typeof core.parseDuration).toBe("function");
    expect(typeof core.formatDuration).toBe("function");
  });

  it("experimental-but-supported entry points still exist", () => {
    expect(typeof core.parseLogsToTrees).toBe("function");
    expect(typeof core.LiveLogAccumulator).toBe("function");
    expect(typeof core.exportRunTree).toBe("function");
    expect(typeof core.diffTraceEvents).toBe("function");
  });

  it("key exported types remain available to typecheck", () => {
    const kind: core.InspectKind = "LLM";
    const confidence: core.AttributionConfidence = "explicit";
    // Value is never used at runtime; it only forces TS to resolve the types.
    const _typeWitness = null as unknown as core.InspectEvent &
      core.InspectRunTree &
      core.LogIngestConfig &
      core.RedactionRule;

    expect(kind).toBe("LLM");
    expect(confidence).toBe("explicit");
    expect(_typeWitness).toBeNull();
  });
});

