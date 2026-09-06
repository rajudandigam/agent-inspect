import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  indexBuildCommand,
  indexCleanCommand,
  indexStatusCommand,
  traceIndexPath,
} from "../src/index-cmd.js";

describe("index CLI", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await indexCleanCommand({ dir: tmpDir, json: true });
    }
    process.exitCode = 0;
    vi.restoreAllMocks();
  });

  it("builds and reports index status", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "ai-index-"));
    await writeFile(
      path.join(tmpDir, "run_test.jsonl"),
      [
        JSON.stringify({
          schemaVersion: "0.1",
          event: "run_started",
          timestamp: 1,
          runId: "run_test",
          name: "demo",
          startTime: 1,
        }),
        JSON.stringify({
          schemaVersion: "0.1",
          event: "run_completed",
          timestamp: 2,
          runId: "run_test",
          status: "success",
          endTime: 2,
          durationMs: 1,
        }),
      ].join("\n") + "\n",
      "utf8",
    );

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await indexBuildCommand({ dir: tmpDir, json: true });
    const buildPayload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(buildPayload.entries.length).toBeGreaterThanOrEqual(1);
    expect(buildPayload.ok).toBe(true);

    logSpy.mockClear();
    await indexStatusCommand({ dir: tmpDir, json: true });
    const statusPayload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(statusPayload.exists).toBe(true);
    expect(statusPayload.stale).toBe(false);

    await indexCleanCommand({ dir: tmpDir });
    expect(traceIndexPath(tmpDir)).toContain(".agent-inspect-index.json");
  });

  it("reports a missing index as an available rebuild", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "ai-index-"));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await indexStatusCommand({ dir: tmpDir, json: true });

    const statusPayload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(statusPayload).toMatchObject({ ok: true, exists: false, stale: true });
    expect(errorSpy).not.toHaveBeenCalled();
    expect(process.exitCode ?? 0).toBe(0);
  });

  it("fails closed when the index snapshot contains malformed JSON", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "ai-index-"));
    await writeFile(traceIndexPath(tmpDir), "{broken", "utf8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await indexStatusCommand({ dir: tmpDir, json: true });

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[AgentInspect] index status failed:"),
    );
    expect(process.exitCode).toBe(1);
  });
});
