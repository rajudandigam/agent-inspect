import { describe, expect, it } from "vitest";

import * as lc from "../src/index.js";

describe("@agent-inspect/langchain API stability (v1.0 Pass 1)", () => {
  it("exports expected public entry points", () => {
    expect(typeof lc.AgentInspectCallback).toBe("function");
    expect(typeof lc.extractModelName).toBe("function");
    expect(typeof lc.extractTokenUsage).toBe("function");
    expect(typeof lc.safePreview).toBe("function");
    expect(typeof lc.toPlainMetadata).toBe("function");

    const _streamingOpts = null as unknown as lc.LangChainStreamingOptions;
    expect(_streamingOpts).toBeNull();
  });

  it("AgentInspectCallback accepts streaming options", () => {
    const cb = new lc.AgentInspectCallback({
      stream: true,
      maxStreamPreviewChars: 64,
      capture: "metadata-only",
    });
    expect(cb.name).toBe("agent-inspect");
    expect(cb.getEvents()).toEqual([]);
    cb.clear();
    expect(cb.getEvents()).toEqual([]);
  });
});

