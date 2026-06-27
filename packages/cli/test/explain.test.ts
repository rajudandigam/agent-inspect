import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { explainCommand } from "../src/explain.js";

describe("explain CLI", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-explain-${Date.now()}`);
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

  async function writeTrace(runId = "explain-run"): Promise<void> {
    const events = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId,
        name: "explain-run",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 2,
        runId,
        stepId: "step_1",
        name: "call-tool",
        type: "tool",
        startTime: 2,
        metadata: { apiKey: "secret-key", toolName: "lookup" },
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: 4,
        runId,
        stepId: "step_1",
        status: "success",
        endTime: 4,
        durationMs: 2,
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 5,
        runId,
        status: "success",
        endTime: 5,
        durationMs: 4,
      },
    ];
    await writeFile(
      path.join(tmpDir, `${runId}.jsonl`),
      events.map((event) => JSON.stringify(event)).join("\n"),
    );
  }

  it("emits dry-run facts without local inferences", async () => {
    await writeTrace();

    await explainCommand("explain-run", {
      dir: tmpDir,
      dryRun: true,
      json: true,
      redactionProfile: "strict",
    });

    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(parsed.ok).toBe(true);
    expect(parsed.explanation.mode).toBe("dry-run");
    expect(parsed.explanation.inferences).toEqual([]);
    expect(parsed.explanation.facts.length).toBeGreaterThan(0);
    expect(JSON.stringify(parsed)).not.toContain("secret-key");
    expect(JSON.stringify(parsed)).toContain("[REDACTED]");
  });

  it("separates deterministic local inferences from observed facts", async () => {
    await writeTrace();

    await explainCommand("explain-run", { dir: tmpDir, json: true });

    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(parsed.explanation.mode).toBe("local");
    expect(parsed.explanation.facts[0]).toMatchObject({
      source: "trace",
      confidence: "observed",
    });
    expect(parsed.explanation.inferences[0]).toMatchObject({
      confidence: "deterministic",
    });
  });

  it("prints human output without provider behavior", async () => {
    await writeTrace();

    await explainCommand("explain-run", { dir: tmpDir });

    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("Explain: explain-run");
    expect(out).toContain("Facts:");
    expect(out).toContain("Inferences:");
    expect(out).toContain("Generated locally without provider or network calls.");
  });

  it("handles unsupported input as a user-facing error", async () => {
    await explainCommand(path.join(tmpDir, "missing.jsonl"), { json: true });

    expect(process.exitCode).toBe(1);
    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(parsed.ok).toBe(false);
    expect(String(parsed.error.message)).toContain("ENOENT");
    expect(errSpy).not.toHaveBeenCalled();
  });
});
