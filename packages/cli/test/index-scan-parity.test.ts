import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  TraceDirectory,
  filterTraces,
  loadSessionRunRecords,
  loadTraceMetadataList,
  type TraceMetadata,
} from "@agent-inspect/core/advanced";
import { buildIndex, queryRuns, resolveIndexDbPath } from "@agent-inspect/index-sqlite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

function jsonl(...lines: string[]): string {
  return lines.join("\n") + "\n";
}

type RunSpec = {
  runId: string;
  name: string;
  startedAt: number;
  status?: "success" | "error";
  sessionId?: string;
  tool?: string;
  llm?: boolean;
  incomplete?: boolean;
};

function trace(spec: RunSpec): string {
  const lines: string[] = [
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: spec.startedAt,
      runId: spec.runId,
      name: spec.name,
      startTime: spec.startedAt,
      ...(spec.sessionId !== undefined ? { metadata: { sessionId: spec.sessionId } } : {}),
    }),
  ];
  let t = spec.startedAt + 10;
  if (spec.tool !== undefined) {
    lines.push(
      JSON.stringify({
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: t,
        runId: spec.runId,
        stepId: "tool_step",
        name: `tool:${spec.tool}`,
        type: "tool",
        startTime: t,
        metadata: { toolName: spec.tool },
      }),
      JSON.stringify({
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: t + 50,
        runId: spec.runId,
        stepId: "tool_step",
        status: "success",
        endTime: t + 50,
        durationMs: 50,
      }),
    );
    t += 60;
  }
  if (spec.llm) {
    lines.push(
      JSON.stringify({
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: t,
        runId: spec.runId,
        stepId: "llm_step",
        name: "llm:generate",
        type: "llm",
        startTime: t,
      }),
      JSON.stringify({
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: t + 80,
        runId: spec.runId,
        stepId: "llm_step",
        status: "success",
        endTime: t + 80,
        durationMs: 80,
      }),
    );
    t += 90;
  }
  if (!spec.incomplete) {
    lines.push(
      JSON.stringify({
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: t,
        runId: spec.runId,
        status: spec.status ?? "success",
        endTime: t,
        durationMs: t - spec.startedAt,
        ...(spec.status === "error" ? { error: { message: "synthetic failure" } } : {}),
      }),
    );
  }
  return jsonl(...lines);
}

const RUNS: RunSpec[] = [
  { runId: "parity-alpha", name: "alpha-run", startedAt: 1_700_000_003_000, status: "success", sessionId: "sess-parity", tool: "alpha-fetch" },
  { runId: "parity-beta", name: "beta-run", startedAt: 1_700_000_002_000, status: "error", sessionId: "sess-parity", llm: true },
  { runId: "parity-gamma", name: "gamma-run", startedAt: 1_700_000_001_000, status: "success", tool: "gamma-fetch" },
  { runId: "parity-partial", name: "partial-run", startedAt: 1_700_000_000_500, incomplete: true },
];

/**
 * Index-versus-scan parity (#109): the SQLite index and the filesystem-scan
 * loaders must agree on filtering, ordering, error handling, and partial
 * data over the same trace directory.
 */
describe("index vs scan parity", () => {
  let traceDir: string;
  let dbPath: string;
  let metas: TraceMetadata[];

  beforeAll(async () => {
    traceDir = path.join(
      os.tmpdir(),
      `agent-inspect-index-parity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    );
    await mkdir(traceDir, { recursive: true });
    for (const spec of RUNS) {
      await writeFile(path.join(traceDir, `${spec.runId}.jsonl`), trace(spec), "utf-8");
    }
    // Error case: a malformed trace file both paths must skip.
    await writeFile(path.join(traceDir, "broken.jsonl"), "{{{ not json\n", "utf-8");

    const built = await buildIndex({ traceDir });
    expect(built.runs).toBe(RUNS.length);
    // The malformed file must surface as a diagnostic, not a crash.
    expect(built.warnings.some((warning) => warning.includes("broken.jsonl"))).toBe(true);
    dbPath = resolveIndexDbPath(traceDir);

    const td = new TraceDirectory({ dir: traceDir });
    const files = (await td.list()).filter((file) => !file.endsWith("trace-index.sqlite"));
    metas = await loadTraceMetadataList(traceDir, files, (f) => td.getPath(f));
  });

  afterAll(async () => {
    await rm(traceDir, { recursive: true, force: true });
  });

  function scanIds(options: Parameters<typeof filterTraces>[1]): string[] {
    return filterTraces(metas, options).map((meta) => meta.runId);
  }

  function indexIds(query: Parameters<typeof queryRuns>[1]): string[] {
    return queryRuns(dbPath, query).map((run) => run.runId);
  }

  it("agrees on the valid run set and newest-first ordering", () => {
    const indexed = indexIds({});
    // The scan path surfaces unreadable files as unknown-status placeholders
    // (runId from filename); the index omits them with a build warning. The
    // parity contract holds over the valid runs.
    const scannedValid = scanIds({}).filter((runId) => runId !== "broken");
    expect(indexed).toEqual(scannedValid);
    expect(indexed).toEqual([
      "parity-alpha",
      "parity-beta",
      "parity-gamma",
      "parity-partial",
    ]);
  });

  it("agrees on status filtering", () => {
    expect(indexIds({ status: "success" })).toEqual(scanIds({ status: "success" }));
    expect(indexIds({ status: "error" })).toEqual(scanIds({ status: "error" }));
    expect(indexIds({ status: "error" })).toEqual(["parity-beta"]);
  });

  it("agrees on name substring filtering", () => {
    expect(indexIds({ name: "alpha" })).toEqual(scanIds({ name: "alpha" }));
    expect(indexIds({ name: "run" })).toEqual(scanIds({ name: "run" }));
    expect(indexIds({ name: "zzz-no-match" })).toEqual(scanIds({ name: "zzz-no-match" }));
  });

  it("agrees on session membership", async () => {
    const records = await loadSessionRunRecords(metas);
    const scanned = records
      .filter((record) => record.metadata?.sessionId === "sess-parity")
      .map((record) => record.runId)
      .sort();
    const indexed = indexIds({ sessionId: "sess-parity" }).sort();
    expect(indexed).toEqual(scanned);
    expect(indexed).toEqual(["parity-alpha", "parity-beta"]);
  });

  it("filters by tool and kind consistently with the trace contents", () => {
    expect(indexIds({ tool: "alpha" })).toEqual(["parity-alpha"]);
    expect(indexIds({ tool: "fetch" }).sort()).toEqual(["parity-alpha", "parity-gamma"]);
    expect(indexIds({ kind: "llm" }).length + indexIds({ kind: "LLM" }).length).toBeGreaterThan(0);
  });

  it("pins the documented divergence for unreadable files", () => {
    // Index: omitted entirely, surfaced as a build warning (asserted in
    // beforeAll). Scan: kept as an unknown-status placeholder so directory
    // listings never silently hide a file. Neither path crashes.
    expect(indexIds({})).not.toContain("broken");
    const placeholder = metas.find((meta) => meta.runId === "broken");
    expect(placeholder?.status).toBe("unknown");
    expect(placeholder?.eventCount).toBe(0);
  });

  it("keeps the partial run visible on both paths", () => {
    const indexedPartial = queryRuns(dbPath, { name: "partial" });
    const scannedPartial = filterTraces(metas, { name: "partial" });
    expect(indexedPartial).toHaveLength(1);
    expect(scannedPartial).toHaveLength(1);
    expect(indexedPartial[0]?.endedAt).toBeNull();
    expect(indexedPartial[0]?.durationMs).toBeNull();
  });

  it("pins the status encoding divergence for incomplete runs", () => {
    // Scan derives status "running" for a run without run_completed; the
    // index stores status null. Consequence, pinned here so a deliberate fix
    // shows up as a test change: a status:"running" filter finds the run via
    // scan but not via the index.
    const scannedPartial = filterTraces(metas, { name: "partial" });
    expect(scannedPartial[0]?.status).toBe("running");

    const indexedPartial = queryRuns(dbPath, { name: "partial" });
    expect(indexedPartial[0]?.status).toBeNull();

    expect(scanIds({ status: "running" })).toEqual(["parity-partial"]);
    expect(indexIds({ status: "running" })).toEqual([]);
  });
});
