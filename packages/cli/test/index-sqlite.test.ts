import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCliProgram } from "../src/index.js";
import {
  indexSqliteBuildCommand,
  indexSqliteCleanCommand,
  indexSqliteQueryCommand,
  indexSqliteStatusCommand,
} from "../src/index-sqlite-cmd.js";

let tmpDir: string;

function line(obj: Record<string, unknown>): string {
  return JSON.stringify({ schemaVersion: "0.1", ...obj });
}

async function writeRun(runId: string, status: "success" | "error"): Promise<void> {
  const events = [
    line({ event: "run_started", timestamp: 1, runId, name: runId, startTime: 1, metadata: {} }),
    line({ event: "step_started", timestamp: 2, runId, stepId: `${runId}_s1`, name: "s", type: "tool", startTime: 2, metadata: { toolName: "search" } }),
    line({ event: "step_completed", timestamp: 3, runId, stepId: `${runId}_s1`, status: "success", endTime: 3, durationMs: 1 }),
    line({ event: "run_completed", timestamp: 4, runId, status, endTime: 4, durationMs: 3 }),
  ];
  await writeFile(path.join(tmpDir, `${runId}.jsonl`), `${events.join("\n")}\n`, "utf-8");
}

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-cli-sqlite-"));
});

afterEach(async () => {
  process.exitCode = 0;
  vi.restoreAllMocks();
  await rm(tmpDir, { recursive: true, force: true });
});

describe("index sqlite CLI registration", () => {
  it("registers the sqlite subgroup under index", () => {
    const program = createCliProgram();
    const index = program.commands.find((c) => c.name() === "index");
    expect(index).toBeDefined();
    const sqlite = index!.commands.find((c) => c.name() === "sqlite");
    expect(sqlite).toBeDefined();
    const subs = sqlite!.commands.map((c) => c.name());
    expect(subs).toEqual(
      expect.arrayContaining(["build", "rebuild", "status", "query", "clean"]),
    );
  });
});

describe("index sqlite commands", () => {
  it("builds, reports status, queries, and cleans", async () => {
    await writeRun("run_ok", "success");
    await writeRun("run_err", "error");

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await indexSqliteBuildCommand({ dir: tmpDir, json: true });
    const build = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(build.ok).toBe(true);
    expect(build.runs).toBe(2);

    await indexSqliteStatusCommand({ dir: tmpDir, json: true });
    const status = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(status.healthy).toBe(true);
    expect(status.runs).toBe(2);
    expect(status.stale).toBe(false);

    await indexSqliteQueryCommand({ dir: tmpDir, json: true, status: "error" });
    const query = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(query.count).toBe(1);
    expect(query.runs[0].runId).toBe("run_err");

    await indexSqliteCleanCommand({ dir: tmpDir, json: true });
    const clean = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(clean.ok).toBe(true);
  });

  it("query without an index exits non-zero with a hint", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await indexSqliteQueryCommand({ dir: tmpDir, json: true });
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(false);
    expect(process.exitCode).toBe(1);
  });
});
