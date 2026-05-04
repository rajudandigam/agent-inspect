import { describe, expect, it } from "vitest";

import { createCliProgram } from "../src/index.js";

describe("@agent-inspect/cli", () => {
  it("exposes the program name and description", () => {
    const program = createCliProgram();
    expect(program.name()).toBe("agent-inspect");
    expect(program.description()).toContain("Local-first");
    expect(program.description()).toContain("execution-tree");
  });

  it("registers list and view commands", () => {
    const program = createCliProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("list");
    expect(names).toContain("view");
  });

  it("help output mentions agent-inspect, list, and view", () => {
    const program = createCliProgram();
    const help = program.helpInformation();
    expect(help).toContain("agent-inspect");
    expect(help).toContain("list");
    expect(help).toContain("view");
  });
});
