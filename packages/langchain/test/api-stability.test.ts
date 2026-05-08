import { describe, expect, it } from "vitest";

import * as lc from "../src/index.js";

describe("@agent-inspect/langchain API stability (v1.0 Pass 1)", () => {
  it("exports expected public entry points", () => {
    expect(typeof lc.AgentInspectCallback).toBe("function");
    expect(typeof lc.extractModelName).toBe("function");
    expect(typeof lc.extractTokenUsage).toBe("function");
    expect(typeof lc.safePreview).toBe("function");
    expect(typeof lc.toPlainMetadata).toBe("function");
  });
});

