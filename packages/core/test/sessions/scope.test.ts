import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { extractMetadata } from "../../src/trace-metadata.js";
import {
  buildSessionIndex,
  filterMetasBySessionScope,
  groupSessionCohorts,
  type SessionRunRecord,
} from "../../src/sessions/index.js";

const fixturesRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../../fixtures/sessions",
);

async function loadSessionFixture(
  scenarioDir: string,
  files: string[],
): Promise<{ metas: Awaited<ReturnType<typeof extractMetadata>>[]; records: SessionRunRecord[] }> {
  const metas = [];
  const records = [];
  for (const file of files) {
    const filePath = path.join(fixturesRoot, scenarioDir, file);
    const meta = await extractMetadata(filePath);
    const raw = await readFile(filePath, "utf-8");
    const firstLine = raw.split(/\r?\n/).find((line) => line.trim() !== "");
    let metadata: Record<string, unknown> | undefined;
    if (firstLine) {
      const parsed = JSON.parse(firstLine) as {
        metadata?: Record<string, unknown>;
      };
      metadata = parsed.metadata;
    }
    metas.push(meta);
    records.push({
      runId: meta.runId,
      name: meta.name,
      status: meta.status,
      startedAt: meta.startedAt,
      endedAt: meta.endedAt,
      durationMs: meta.durationMs,
      filePath,
      metadata,
    });
  }
  return { metas, records };
}

describe("session scope helpers", () => {
  it("filters metas by session id", async () => {
    const { metas, records } = await loadSessionFixture("multi-agent-handoff", [
      "handoff-worker.jsonl",
      "handoff-planner.jsonl",
    ]);
    const scoped = filterMetasBySessionScope(metas, records, {
      sessionId: "sess-handoff-001",
    });
    expect(scoped.notFound).toBe(false);
    expect(scoped.runIds.sort()).toEqual(["handoff-planner", "handoff-worker"]);
    expect(scoped.metas.map((meta) => meta.runId).sort()).toEqual(scoped.runIds);
  });

  it("filters metas by group id", async () => {
    const { metas, records } = await loadSessionFixture("multi-agent-handoff", [
      "handoff-worker.jsonl",
      "handoff-planner.jsonl",
    ]);
    const scoped = filterMetasBySessionScope(metas, records, {
      groupId: "grp-handoff",
    });
    expect(scoped.scopeKind).toBe("group");
    expect(scoped.runIds).toHaveLength(2);
  });

  it("groups cohorts by session", async () => {
    const { records } = await loadSessionFixture("retry-attempts", [
      "retry-run-1.jsonl",
      "retry-run-2.jsonl",
    ]);
    const cohorts = groupSessionCohorts(records, { groupBy: "session" });
    expect(cohorts.some((cohort) => cohort.key === "sess-retry-001")).toBe(true);
    expect(buildSessionIndex(records).sessions).toHaveLength(1);
  });
});
