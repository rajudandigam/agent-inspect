import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildIndex,
  cleanIndex,
  indexStatus,
  isIndexStale,
  queryRuns,
  rebuildIndex,
  resolveIndexDbPath,
} from "../src/index.js";

let traceDir: string;

function line(obj: Record<string, unknown>): string {
  return JSON.stringify({ schemaVersion: "0.1", ...obj });
}

async function writeRun(
  runId: string,
  opts: {
    status?: "success" | "error";
    name?: string;
    sessionId?: string;
    tool?: string;
    kind?: string;
  } = {},
): Promise<void> {
  const status = opts.status ?? "success";
  const events = [
    line({
      event: "run_started",
      timestamp: 1,
      runId,
      name: opts.name ?? runId,
      startTime: 1,
      metadata: opts.sessionId ? { sessionId: opts.sessionId, correlationId: "corr1" } : {},
    }),
    line({
      event: "step_started",
      timestamp: 2,
      runId,
      stepId: `${runId}_s1`,
      name: "step-1",
      type: opts.kind ?? "tool",
      startTime: 2,
      metadata: opts.tool ? { toolName: opts.tool } : {},
    }),
    line({
      event: "step_completed",
      timestamp: 3,
      runId,
      stepId: `${runId}_s1`,
      status: "success",
      endTime: 3,
      durationMs: 1,
    }),
    line({
      event: "run_completed",
      timestamp: 4,
      runId,
      status,
      endTime: 4,
      durationMs: 3,
      ...(status === "error" ? { error: { message: "boom", code: "E_FAIL" } } : {}),
    }),
  ];
  await writeFile(path.join(traceDir, `${runId}.jsonl`), `${events.join("\n")}\n`, "utf-8");
}

beforeEach(async () => {
  traceDir = await mkdtemp(path.join(os.tmpdir(), "ai-index-"));
});

afterEach(async () => {
  await rm(traceDir, { recursive: true, force: true });
});

describe("buildIndex", () => {
  it("indexes runs, steps, and errors from JSONL", async () => {
    await writeRun("run_a", { sessionId: "sess1", tool: "search" });
    await writeRun("run_b", { status: "error" });

    const result = await buildIndex({ traceDir });
    expect(result.runs).toBe(2);
    expect(result.steps).toBe(2);
    expect(result.errors).toBe(1);
    expect(result.dbPath).toBe(resolveIndexDbPath(traceDir));

    const status = indexStatus(result.dbPath);
    expect(status.healthy).toBe(true);
    expect(status.runs).toBe(2);
    expect(status.schemaVersion).toBe("1");
  });

  it("is idempotent across rebuilds", async () => {
    await writeRun("run_a", { sessionId: "sess1" });
    await writeRun("run_b");

    const first = await buildIndex({ traceDir });
    const second = await rebuildIndex({ traceDir });
    expect(second.runs).toBe(first.runs);
    expect(second.steps).toBe(first.steps);
    expect(queryRuns(second.dbPath).length).toBe(2);
  });

  it("skips files without a run_started event", async () => {
    await writeRun("run_a");
    await writeFile(path.join(traceDir, "junk.jsonl"), line({ event: "step_completed", timestamp: 1, runId: "x", stepId: "y", status: "success", endTime: 1, durationMs: 1 }) + "\n", "utf-8");

    const result = await buildIndex({ traceDir });
    expect(result.runs).toBe(1);
    expect(result.warnings.some((w) => w.includes("junk.jsonl"))).toBe(true);
  });
});

describe("queryRuns", () => {
  it("filters by status, session, tool, kind, and name", async () => {
    await writeRun("run_ok", { sessionId: "sess1", tool: "search", kind: "tool", name: "alpha" });
    await writeRun("run_err", { status: "error", name: "beta", kind: "logic" });

    const db = (await buildIndex({ traceDir })).dbPath;
    expect(queryRuns(db, { status: "error" }).map((r) => r.runId)).toEqual(["run_err"]);
    expect(queryRuns(db, { sessionId: "sess1" }).map((r) => r.runId)).toEqual(["run_ok"]);
    expect(queryRuns(db, { tool: "sea" }).map((r) => r.runId)).toEqual(["run_ok"]);
    expect(queryRuns(db, { kind: "tool" }).map((r) => r.runId)).toEqual(["run_ok"]);
    expect(queryRuns(db, { name: "beta" }).map((r) => r.runId)).toEqual(["run_err"]);
  });

  it("returns [] for a missing index", () => {
    expect(queryRuns(path.join(traceDir, "nope.sqlite"))).toEqual([]);
  });
});

describe("corruption recovery", () => {
  it("treats a corrupt database as absent, then rebuilds cleanly", async () => {
    await writeRun("run_a");
    const { dbPath } = await buildIndex({ traceDir });

    writeFileSync(dbPath, "this is not a database", "utf-8");
    expect(indexStatus(dbPath).healthy).toBe(false);
    expect(queryRuns(dbPath)).toEqual([]);
    expect(isIndexStale(dbPath, 0)).toBe(true);

    const rebuilt = await rebuildIndex({ traceDir });
    expect(indexStatus(rebuilt.dbPath).healthy).toBe(true);
    expect(queryRuns(rebuilt.dbPath).length).toBe(1);
  });
});

describe("staleness and cleanup", () => {
  it("reports stale when traces are newer than the index", async () => {
    await writeRun("run_a");
    const { dbPath, builtAt } = await buildIndex({ traceDir });
    const builtMs = Date.parse(builtAt);
    expect(isIndexStale(dbPath, builtMs - 1000)).toBe(false);
    expect(isIndexStale(dbPath, builtMs + 1000)).toBe(true);
  });

  it("cleanIndex removes the database and leaves traces intact", async () => {
    await writeRun("run_a");
    const { dbPath } = await buildIndex({ traceDir });
    await cleanIndex(dbPath);
    expect(indexStatus(dbPath).exists).toBe(false);
    const rebuilt = await buildIndex({ traceDir });
    expect(rebuilt.runs).toBe(1);
  });
});
