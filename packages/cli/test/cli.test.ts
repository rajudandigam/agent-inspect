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
    expect(names).toContain("migrate");
    expect(names).toContain("init");
    expect(names).toContain("doctor");
    expect(names).toContain("check");
    expect(names).toContain("eval");
    expect(names).toContain("suite");
    expect(names).toContain("cohort");
    expect(names).toContain("gate");
    expect(names).toContain("viewer");
    expect(names).toContain("studio");
    expect(names).toContain("scan");
    expect(names).toContain("verify-safe");
    expect(names).toContain("artifacts");
    expect(names).toContain("ci-summary");
    expect(names).toContain("diff");
    expect(names).toContain("what");
    expect(names).toContain("report");
    expect(names).toContain("redact");
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
    expect(help).toContain("migrate");
    expect(help).toContain("check");
    expect(help).toContain("eval");
    expect(help).toContain("scan");
    expect(help).toContain("verify-safe");
    expect(help).toContain("artifacts");
    expect(help).toContain("ci-summary");
    expect(help).toContain("diff");
    expect(help).toContain("redact");
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

  it("migrate help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "migrate");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--to");
    expect(help).toContain("--dry-run");
    expect(help).toContain("--output");
    expect(help).toContain("--force");
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

  it("eval help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "eval");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--config");
    expect(help).toContain("--require-success");
    expect(help).toContain("--forbid-tool");
    expect(help).toContain("--citation-presence");
  });

  it("scan and verify-safe help mention key options", () => {
    const program = createCliProgram();
    for (const name of ["scan", "verify-safe"]) {
      const cmd = program.commands.find((c) => c.name() === name);
      expect(cmd).toBeDefined();
      const help = cmd!.helpInformation();
      expect(help).toContain("--format");
      expect(help).toContain("--run");
      expect(help).toContain("--json");
      expect(help).toContain("--max-string-length");
    }
  });

  it("artifacts help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "artifacts");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--output-dir");
    expect(help).toContain("--baseline");
    expect(help).toContain("--github-summary");
    expect(help).toContain("--json");
  });

  it("ci-summary help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "ci-summary");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--output");
    expect(help).toContain("--github-summary");
    expect(help).toContain("--json");
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

  it("redact help mentions key options", () => {
    const program = createCliProgram();
    const cmd = program.commands.find((c) => c.name() === "redact");
    expect(cmd).toBeDefined();
    const help = cmd!.helpInformation();
    expect(help).toContain("--profile");
    expect(help).toContain("--output");
    expect(help).toContain("--json");
  });
});
