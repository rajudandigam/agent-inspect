import { cp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchCommand } from "../src/search.js";

describe("search CLI", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-search-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("finds error status", async () => {
    const fixtures = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../fixtures/traces",
    );
    await cp(path.join(fixtures, "minimal-error.jsonl"), path.join(tmpDir, "minimal-error.jsonl"));
    await searchCommand({ dir: tmpDir, status: "error" });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("minimal-error");
  });

  it("finds tool steps", async () => {
    const fixtures = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../fixtures/traces",
    );
    await cp(path.join(fixtures, "tool-with-io.jsonl"), path.join(tmpDir, "tool-with-io.jsonl"));
    await searchCommand({ dir: tmpDir, kind: "tool" });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("tool");
  });

  it("emits valid JSON", async () => {
    const fixtures = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../fixtures/traces",
    );
    await cp(path.join(fixtures, "minimal-success.jsonl"), path.join(tmpDir, "minimal-success.jsonl"));
    await searchCommand({ dir: tmpDir, json: true });
    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(Array.isArray(parsed)).toBe(true);
  });

  it("finds v0.2 runs and steps by normalized metadata", async () => {
    const fixture = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../fixtures/traces-v0.2/dual-format-parity.jsonl",
    );
    await cp(fixture, path.join(tmpDir, "dual-format-parity.jsonl"));

    await searchCommand({
      dir: tmpDir,
      status: "success",
      kind: "tool",
      tool: "fixture-search",
      duration: ">=500ms",
      json: true,
    });

    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      runId: "run_dual_format_parity",
      runStatus: "success",
      stepName: "fixture-search",
      stepType: "tool",
      durationMs: 500,
    });
  });

  it("filters results by session id", async () => {
    const fixtures = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../fixtures/sessions/multi-agent-handoff",
    );
    await cp(path.join(fixtures, "handoff-planner.jsonl"), path.join(tmpDir, "handoff-planner.jsonl"));
    await cp(path.join(fixtures, "handoff-worker.jsonl"), path.join(tmpDir, "handoff-worker.jsonl"));
    await searchCommand({ dir: tmpDir, session: "sess-handoff-001", json: true });
    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0])) as Array<{
      runId: string;
      sessionId?: string;
    }>;
    expect(parsed.map((row) => row.runId).sort()).toEqual([
      "handoff-planner",
      "handoff-worker",
    ]);
    expect(parsed.every((row) => row.sessionId === "sess-handoff-001")).toBe(true);
  });

  it("sets exit code 1 when the session id is not found", async () => {
    const fixtures = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../fixtures/sessions/multi-agent-handoff",
    );
    await cp(path.join(fixtures, "handoff-planner.jsonl"), path.join(tmpDir, "handoff-planner.jsonl"));

    const prevExitCode = process.exitCode;
    try {
      process.exitCode = 0;
      await searchCommand({ dir: tmpDir, session: "sess-does-not-exist" });
      const out = logSpy.mock.calls.flat().join("\n");
      expect(out).toContain("Session not found: sess-does-not-exist");
      expect(process.exitCode).toBe(1);

      process.exitCode = 0;
      logSpy.mockClear();
      await searchCommand({ dir: tmpDir, session: "sess-does-not-exist", json: true });
      const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
      expect(parsed).toEqual([]);
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = prevExitCode ?? 0;
    }
  });
});
