import { describe, expect, it } from "vitest";
import { version as packageVersion } from "../../../package.json";

import { createCliProgram } from "../src/index.js";

describe("@agent-inspect/cli", () => {
  it("reports the public root package version", () => {
    expect(createCliProgram().version()).toBe(packageVersion);
  });

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
    expect(names).toContain("export");
    expect(names).toContain("open");
    expect(names).toContain("check");
    expect(names).toContain("diff");
    expect(names).toContain("what");
    expect(names).toContain("report");
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
    expect(help).toContain("export");
    expect(help).toContain("open");
    expect(help).toContain("check");
    expect(help).toContain("diff");
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

  it("export help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "export");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--format");
    expect(help).toContain("--output");
    expect(help).toContain("--validate");
    expect(help).toContain("--include-attributes");
  });

  it("diff help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "diff");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--json");
    expect(help).toContain("--ignore-duration");
    expect(help).toContain("--duration-threshold");
    expect(help).toContain("--focus");
    expect(help).toContain("--check");
  });

  it("open help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "open");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--format");
    expect(help).toContain("--json");
    expect(help).toContain("--diagnostics");
    expect(help).toContain("--run");
  });

  it("check help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "check");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--format");
    expect(help).toContain("--config");
    expect(help).toContain("--rule");
    expect(help).toContain("--max-duration-ms");
  });

  it("what help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "what");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--json");
    expect(help).toContain("--no-correlation");
  });

  it("report help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "report");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--format");
    expect(help).toContain("--output");
    expect(help).toContain("--redaction-profile");
    expect(help).toContain("--include-attributes");
  });
});
