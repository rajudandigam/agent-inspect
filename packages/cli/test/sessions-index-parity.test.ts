import { copyFile, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSessionIndex } from "@agent-inspect/core/advanced";
import { buildIndex } from "@agent-inspect/index-sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadSessionRuns } from "../src/sessions-load.js";

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../fixtures/sessions",
);

async function copySessionFixtures(tmpDir: string): Promise<void> {
  const scenarios = [
    ["multi-agent-handoff", "handoff-planner.jsonl"],
    ["multi-agent-handoff", "handoff-worker.jsonl"],
    ["retry-attempts", "retry-run-1.jsonl"],
    ["retry-attempts", "retry-run-2.jsonl"],
  ] as const;

  for (const [scenario, file] of scenarios) {
    await copyFile(
      path.join(fixturesRoot, scenario, file),
      path.join(tmpDir, file),
    );
  }
}

describe("sessions index parity", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-sessions-parity-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    await copySessionFixtures(tmpDir);
    await buildIndex({ traceDir: tmpDir });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("produces the same session ids via index and scan loaders", async () => {
    const indexed = await loadSessionRuns(tmpDir);
    expect(indexed.source).toBe("index");

    const { TraceDirectory, loadTraceMetadataList, loadSessionRunRecords } =
      await import("@agent-inspect/core/advanced");
    const td = new TraceDirectory({ dir: tmpDir });
    const files = await td.list();
    const metas = await loadTraceMetadataList(tmpDir, files, (f) => td.getPath(f));
    const scanOnly = await loadSessionRunRecords(metas);

    const indexSessions = buildSessionIndex(indexed.runs)
      .sessions.map((s) => s.sessionId)
      .sort();
    const scanSessions = buildSessionIndex(scanOnly)
      .sessions.map((s) => s.sessionId)
      .sort();

    expect(indexSessions).toEqual(scanSessions);
  });
});
