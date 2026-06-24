import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reportCommand } from "../src/report.js";

describe("report CLI", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-report-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    process.exitCode = 0;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("reports missing run", async () => {
    await reportCommand("missing", { dir: tmpDir });
    expect(process.exitCode).toBe(1);
    expect(logSpy.mock.calls.flat().join(" ")).toContain("Run not found");
  });

  it("renders markdown report to stdout", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces/minimal-success.jsonl",
    );
    const raw = await readFile(fixture, "utf-8");
    await writeFile(path.join(tmpDir, "minimal-success.jsonl"), raw);
    await reportCommand("minimal-success", { dir: tmpDir, format: "markdown" });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("# AgentInspect Report: minimal-success");
    expect(out).toContain("## What happened");
    expect(out).toContain("## Timeline");
  });

  it("writes html report to file", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces/minimal-success.jsonl",
    );
    const raw = await readFile(fixture, "utf-8");
    await writeFile(path.join(tmpDir, "minimal-success.jsonl"), raw);
    const outPath = path.join(tmpDir, "nested", "report.html");
    await reportCommand("minimal-success", {
      dir: tmpDir,
      format: "html",
      output: outPath,
    });
    const html = await readFile(outPath, "utf-8");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("AgentInspect Report: minimal-success");
  });

  it("emits valid JSON wrapper", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces/minimal-success.jsonl",
    );
    const raw = await readFile(fixture, "utf-8");
    await writeFile(path.join(tmpDir, "minimal-success.jsonl"), raw);
    await reportCommand("minimal-success", {
      dir: tmpDir,
      format: "markdown",
      json: true,
    });
    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(parsed.format).toBe("markdown");
    expect(String(parsed.content)).toContain("# AgentInspect Report:");
  });

  it("applies strict redaction to the complete report", async () => {
    const events = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "strict-report",
        name: "strict-report",
        startTime: 1,
        metadata: { correlationId: "cli-correlation-secret" },
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 2,
        runId: "strict-report",
        status: "error",
        endTime: 2,
        durationMs: 1,
        error: { message: "cli-error-secret" },
      },
    ];
    await writeFile(
      path.join(tmpDir, "strict-report.jsonl"),
      events.map((event) => JSON.stringify(event)).join("\n"),
    );

    await reportCommand("strict-report", {
      dir: tmpDir,
      format: "markdown",
      redactionProfile: "strict",
    });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("[REDACTED]");
    expect(out).not.toContain("cli-correlation-secret");
    expect(out).not.toContain("cli-error-secret");
  });

  it("rejects unsupported format", async () => {
    await reportCommand("x", { format: "pdf" });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.flat().join(" ")).toContain("Unsupported --format");
  });
});
