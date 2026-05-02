import { describe, expect, it } from "vitest";

import { createCliProgram } from "../src/index.js";

describe("@agent-inspect/cli scaffold", () => {
  it("exposes the program name", () => {
    const program = createCliProgram();
    expect(program.name()).toBe("agent-inspect");
  });
});
