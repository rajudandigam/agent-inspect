import { describe, expect, it } from "vitest";

import {
  evaluateSameArgsRepetition,
  evaluateSameToolRepetition,
  evaluateToolTimeout,
  runCircuits,
  type CircuitTraceEvent,
} from "../src/index.js";

const toolEvents = (count: number, args: unknown = { q: "x" }): CircuitTraceEvent[] =>
  Array.from({ length: count }, (_, index) => ({
    eventId: `e-${index}`,
    name: "tool:search",
    kind: "tool",
    attributes: { toolName: "search", arguments: args },
  }));

describe("@agent-inspect/circuit", () => {
  it("opens on same tool repetition", () => {
    const result = evaluateSameToolRepetition(toolEvents(4), 3);
    expect(result.status).toBe("open");
    expect(result.evidence[0]?.toolName).toBe("search");
  });

  it("opens on same args repetition", () => {
    const result = evaluateSameArgsRepetition(toolEvents(3, { q: "same" }), 2);
    expect(result.status).toBe("open");
  });

  it("warns on tool timeout", () => {
    const result = evaluateToolTimeout(
      [{ name: "tool:slow", kind: "tool", durationMs: 5_000, attributes: { toolName: "slow" } }],
      1_000,
    );
    expect(result.status).toBe("warn");
  });

  it("runs configured circuits", () => {
    const result = runCircuits(toolEvents(5), {
      rules: ["circuit.same-tool-repetition"],
      sameToolRepetition: { maxRepeats: 2 },
    });
    expect(result.ok).toBe(false);
    expect(result.results).toHaveLength(1);
  });
});
