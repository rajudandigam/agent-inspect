import { describe, expect, it } from "vitest";

import { inspectRun, step } from "../src/index.js";

describe("package exports", () => {
  it("exposes inspectRun and step from the barrel", () => {
    expect(typeof inspectRun).toBe("function");
    expect(typeof step).toBe("function");
    expect(typeof step.llm).toBe("function");
    expect(typeof step.tool).toBe("function");
  });
});
