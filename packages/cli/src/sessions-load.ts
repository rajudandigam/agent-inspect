import path from "node:path";

import {
  TraceDirectory,
  enrichSessionRunRecord,
  loadSessionRunRecords,
  loadTraceMetadataList,
  type SessionRunRecord,
  type TraceMetadata,
  type TraceMetadataStatus,
} from "@agent-inspect/core/advanced";

function isModuleNotFound(e: unknown): boolean {
  return (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    ((e as NodeJS.ErrnoException).code === "ERR_MODULE_NOT_FOUND" ||
      (e as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND")
  );
}

function toStatus(raw: string | null | undefined): TraceMetadataStatus {
  if (raw === "success" || raw === "error" || raw === "running") return raw;
  return "unknown";
}

function indexedToMetadata(
  row: {
    runId: string;
    file: string;
    name: string | null;
    status: string | null;
    startedAt: number | null;
    endedAt: number | null;
    durationMs: number | null;
    mtimeMs: number;
  },
  traceDir: string,
): TraceMetadata {
  return {
    runId: row.runId,
    name: row.name ?? undefined,
    status: toStatus(row.status),
    startedAt: row.startedAt ?? undefined,
    endedAt: row.endedAt ?? undefined,
    durationMs: row.durationMs ?? undefined,
    eventCount: 0,
    filePath: path.join(traceDir, row.file),
    fileSize: 0,
    createdAt: new Date(row.mtimeMs),
  };
}

async function loadFromScan(traceDir: string): Promise<SessionRunRecord[]> {
  const td = new TraceDirectory({ dir: traceDir });
  const files = await td.list();
  const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
    td.getPath(fileName),
  );
  return loadSessionRunRecords(metas);
}

async function newestTraceMtimeMs(traceDir: string): Promise<number> {
  const td = new TraceDirectory({ dir: traceDir });
  let newest = 0;
  for (const file of await td.list()) {
    try {
      const stats = await td.getFileStats(file);
      if (stats.mtimeMs > newest) newest = stats.mtimeMs;
    } catch {
      // ignore
    }
  }
  return newest;
}

export interface LoadSessionRunsResult {
  runs: SessionRunRecord[];
  source: "index" | "scan";
}

/**
 * Loads session run records, preferring a healthy SQLite index when available.
 * Always enriches from trace files so handoff/retry metadata matches the scan path.
 */
export async function loadSessionRuns(traceDir: string): Promise<LoadSessionRunsResult> {
  try {
    const mod = (await import("@agent-inspect/index-sqlite")) as {
      resolveIndexDbPath: (dir: string) => string;
      indexStatus: (dbPath: string) => { healthy: boolean };
      isIndexStale: (dbPath: string, newestTraceMtimeMs: number) => boolean;
      queryRuns: (
        dbPath: string,
        query?: { limit?: number },
      ) => Array<{
        runId: string;
        file: string;
        mtimeMs: number;
        name: string | null;
        status: string | null;
        startedAt: number | null;
        endedAt: number | null;
        durationMs: number | null;
      }>;
    };

    const dbPath = mod.resolveIndexDbPath(traceDir);
    const status = mod.indexStatus(dbPath);
    if (!status.healthy) {
      return { runs: await loadFromScan(traceDir), source: "scan" };
    }

    const newest = await newestTraceMtimeMs(traceDir);
    if (mod.isIndexStale(dbPath, newest)) {
      return { runs: await loadFromScan(traceDir), source: "scan" };
    }

    const indexed = mod.queryRuns(dbPath, { limit: 10_000 });
    if (indexed.length === 0) {
      return { runs: await loadFromScan(traceDir), source: "scan" };
    }

    const runs: SessionRunRecord[] = [];
    for (const row of indexed) {
      runs.push(await enrichSessionRunRecord(indexedToMetadata(row, traceDir)));
    }
    runs.sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0));
    return { runs, source: "index" };
  } catch (e) {
    if (!isModuleNotFound(e)) {
      // degrade to scan on unexpected index errors
    }
    return { runs: await loadFromScan(traceDir), source: "scan" };
  }
}
