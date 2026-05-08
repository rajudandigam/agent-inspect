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
    expect(names).toContain("clean");
    expect(names).toContain("logs");
    expect(names).toContain("tail");
  });

  it("help output mentions agent-inspect, list, and view", () => {
    const program = createCliProgram();
    const help = program.helpInformation();
    expect(help).toContain("agent-inspect");
    expect(help).toContain("list");
    expect(help).toContain("view");
    expect(help).toContain("clean");
    expect(help).toContain("logs");
    expect(help).toContain("tail");
  });

  it("clean help mentions key options", () => {
    const program = createCliProgram();
    const clean = program.commands.find((c) => c.name() === "clean");
    expect(clean).toBeDefined();
    const help = clean!.helpInformation();
    expect(help).toContain("--older-than");
    expect(help).toContain("--keep");
    expect(help).toContain("--dry-run");
    expect(help).toContain("--yes");
  });

  it("logs help mentions key options", () => {
    const program = createCliProgram();
    const logs = program.commands.find((c) => c.name() === "logs");
    expect(logs).toBeDefined();
    const help = logs!.helpInformation();
    expect(help).toContain("--format");
    expect(help).toContain("--config");
    expect(help).toContain("--run-id-key");
    expect(help).toContain("--json");
    expect(help).toContain("--warnings");
  });

  it("tail help mentions key options", () => {
    const program = createCliProgram();
    const tail = program.commands.find((c) => c.name() === "tail");
    expect(tail).toBeDefined();
    const help = tail!.helpInformation();
    expect(help).toContain("--file");
    expect(help).toContain("--format");
    expect(help).toContain("--config");
    expect(help).toContain("--refresh");
    expect(help).toContain("--once");
    expect(help).toContain("--json");
    expect(help).toContain("--warnings");
    expect(help).toContain("--no-clear");
  });

  it("view help mentions --tui", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "view");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--tui");
  });
});
