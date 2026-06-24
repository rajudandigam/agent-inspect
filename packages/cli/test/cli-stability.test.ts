import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCliProgram } from "../src/index.js";
import { list } from "../src/list.js";
import { view } from "../src/view.js";
import { logs } from "../src/logs.js";
import { exportCommand } from "../src/export.js";
import { diffCommand } from "../src/diff.js";
import { clean } from "../src/clean.js";

function jsonl(...lines: string[]): string {
  return lines.join("\n") + "\n";
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");

describe("CLI stability (v1.0 Pass 1)", () => {
  let traceDir: string;
  const prevEnv = process.env.AGENT_INSPECT_TRACE_DIR;

  beforeEach(async () => {
    traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-cli-stability-"));
    delete process.env.AGENT_INSPECT_TRACE_DIR;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(traceDir, { recursive: true, force: true });
    if (prevEnv === undefined) delete process.env.AGENT_INSPECT_TRACE_DIR;
    else process.env.AGENT_INSPECT_TRACE_DIR = prevEnv;
  });

  it("main help includes all stable commands", () => {
    const help = createCliProgram().helpInformation();
    for (const cmd of [
      "list",
      "view",
      "clean",
      "logs",
      "tail",
      "export",
      "diff",
      "timeline",
      "stats",
      "search",
      "what",
      "report",
    ]) {
      expect(help).toContain(cmd);
    }
  });

  it("each command help renders", () => {
    const program = createCliProgram();
    for (const cmd of [
      "list",
      "view",
      "clean",
      "logs",
      "tail",
      "export",
      "diff",
      "timeline",
      "stats",
      "search",
      "what",
      "report",
    ]) {
      const c = program.commands.find((x) => x.name() === cmd);
      expect(c).toBeDefined();
      expect(c!.helpInformation()).toContain(cmd);
    }
  });

  it("expected user errors set exitCode=1 without throwing", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await view("missing_run", { dir: traceDir });
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
  });

  it("--json output is parseable for list/view/logs/export/diff when feasible", async () => {
    const runIdA = "run_a";
    const runIdB = "run_b";
    await writeFile(
      path.join(traceDir, `${runIdA}.jsonl`),
      jsonl(
        JSON.stringify({
          schemaVersion: "0.1",
          event: "run_started",
          timestamp: 1,
          runId: runIdA,
          name: "a",
          startTime: 1,
        }),
        JSON.stringify({
          schemaVersion: "0.1",
          event: "run_completed",
          timestamp: 2,
          runId: runIdA,
          status: "success",
          endTime: 2,
          durationMs: 1,
        }),
      ),
      "utf-8",
    );
    await writeFile(
      path.join(traceDir, `${runIdB}.jsonl`),
      jsonl(
        JSON.stringify({
          schemaVersion: "0.1",
          event: "run_started",
          timestamp: 1,
          runId: runIdB,
          name: "b",
          startTime: 1,
        }),
        JSON.stringify({
          schemaVersion: "0.1",
          event: "run_completed",
          timestamp: 2,
          runId: runIdB,
          status: "error",
          endTime: 2,
          durationMs: 1,
          error: { message: "boom" },
        }),
      ),
      "utf-8",
    );

    // list --json
    {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await list({ dir: traceDir, json: true });
      JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "null"));
      logSpy.mockRestore();
    }

    // view --json
    {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await view(runIdA, { dir: traceDir, json: true });
      JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "null"));
      logSpy.mockRestore();
    }

    // logs --json (fixture log)
    {
      const file = path.join(repoRoot, "fixtures/logs/proactive-json.log");
      const cfg = path.join(repoRoot, "fixtures/configs/proactive-agent-inspect.logs.json");
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await logs(file, { format: "json", config: cfg, json: true });
      JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "null"));
      logSpy.mockRestore();
    }

    // export --json
    {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await exportCommand(runIdA, { dir: traceDir, format: "openinference", json: true });
      JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "null"));
      logSpy.mockRestore();
    }

    // diff --json
    {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await diffCommand(runIdA, runIdB, { dir: traceDir, json: true });
      JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "null"));
      logSpy.mockRestore();
    }
  });

  it("invalid duration for clean fails clearly", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await clean({ dir: traceDir, olderThan: "nope" });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("Invalid duration"))).toBe(true);
    errSpy.mockRestore();
  });
});

