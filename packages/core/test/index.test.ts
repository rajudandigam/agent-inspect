import { describe, expect, it } from "vitest";

import { inspectRun, step, observe } from "../src/index.js";

describe("package exports", () => {
  it("exposes inspectRun, step, and observe from the barrel", () => {
    expect(typeof inspectRun).toBe("function");
    expect(typeof step).toBe("function");
    expect(typeof step.llm).toBe("function");
    expect(typeof step.tool).toBe("function");
    expect(typeof observe).toBe("function");
  });
});
