import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateCommand } from "../src/migrate.js";

function v01Trace(runId: string): string {
  return [
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId,
      name: "migration-run",
      startTime: 1,
      metadata: { requestId: "req_1" },
    }),
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 2,
      runId,
      status: "success",
      endTime: 2,
      durationMs: 1,
    }),
    "",
  ].join("\n");
}

function v02Row(): string {
  return `${JSON.stringify({
    schemaVersion: "0.2",
    eventId: "persisted_1",
    runId: "run_persisted",
    kind: "TOOL",
    name: "lookup",
    status: "ok",
    timestamp: "2026-06-27T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    stableExtension: { kept: true },
  })}\n`;
}

describe("migrate CLI", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-cli-migrate-"));
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("dry-runs v0.1 to v1.0 migration without mutating input", async () => {
    const input = path.join(tmpDir, "trace.jsonl");
    const original = v01Trace("run_dry");
    await writeFile(input, original, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await migrateCommand(input, { to: "1.0", dryRun: true });

    const summary = logSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(summary).toContain("AgentInspect migration summary");
    expect(summary).toContain("Target schemaVersion: 1.0");
    expect(summary).toContain("Source formats: 0.1");
    expect(summary).toContain("Output rows: 2");
    expect(summary).toContain("Dry run: no files written.");
    expect(await readFile(input, "utf-8")).toBe(original);
  });

  it("writes migrated schema 1.0 JSONL to an explicit output file", async () => {
    const input = path.join(tmpDir, "trace.jsonl");
    const output = path.join(tmpDir, "migrated", "trace.v1.jsonl");
    await writeFile(input, `${v01Trace("run_write")}${v02Row()}`, "utf-8");
    vi.spyOn(console, "log").mockImplementation(() => {});

    await migrateCommand(input, { to: "1.0", output });

    const rows = (await readFile(output, "utf-8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.schemaVersion === "1.0")).toBe(true);
    expect(rows[2]).toMatchObject({
      eventId: "persisted_1",
      stableExtension: { kept: true },
    });
  });

  it("reports malformed rows deterministically and migrates valid rows", async () => {
    const input = path.join(tmpDir, "malformed.jsonl");
    await writeFile(
      input,
      [
        "{not json}",
        JSON.stringify({ schemaVersion: "9.9", value: true }),
        v02Row().trim(),
        "",
      ].join("\n"),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await migrateCommand(input, { to: "1.0", dryRun: true });

    const summary = logSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(summary).toContain("Valid rows: 1");
    expect(summary).toContain("Skipped rows: 2");
    expect(summary).toContain("Warnings: 2");
    expect(summary).toContain("line 1: Skipped invalid JSON line.");
    expect(summary).toContain("line 2: Skipped unsupported schemaVersion.");
  });

  it("refuses traversal output outside the input directory", async () => {
    const input = path.join(tmpDir, "trace.jsonl");
    await writeFile(input, v01Trace("run_traversal"), "utf-8");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const outside = path.join(tmpDir, "..", `outside-${Date.now()}.jsonl`);

    await migrateCommand(input, { to: "1.0", output: outside });

    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.map((call) => String(call[0])).join("\n")).toContain(
      "Refusing to write migrated output outside the input directory.",
    );
  });

  it("refuses to overwrite the input trace", async () => {
    const input = path.join(tmpDir, "trace.jsonl");
    const original = v01Trace("run_same_file");
    await writeFile(input, original, "utf-8");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await migrateCommand(input, { to: "1.0", output: input, force: true });

    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.map((call) => String(call[0])).join("\n")).toContain(
      "Refusing to overwrite the input trace.",
    );
    expect(await readFile(input, "utf-8")).toBe(original);
  });
});
