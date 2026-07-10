import { existsSync } from "node:fs";

import Database from "better-sqlite3";

import { META_KEYS } from "./schema.js";
import type { IndexStatus, IndexedRun, RunQuery } from "./types.js";

interface OpenResult {
  db: Database.Database;
  healthy: boolean;
}

/**
 * Opens the index read-only and verifies integrity. Returns `null` when the
 * file is missing or fails `integrity_check` (corruption), so callers can fall
 * back to a full rebuild or a directory scan.
 */
function openHealthy(dbPath: string): OpenResult | null {
  if (!existsSync(dbPath)) return null;
  try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    try {
      const result = db.pragma("integrity_check", { simple: true });
      if (result !== "ok") {
        db.close();
        return null;
      }
      // Confirm the expected schema is present.
      db.prepare(`SELECT 1 FROM meta LIMIT 1`).get();
      db.prepare(`SELECT 1 FROM runs LIMIT 1`).get();
      return { db, healthy: true };
    } catch {
      db.close();
      return null;
    }
  } catch {
    return null;
  }
}

function meta(db: Database.Database, key: string): string | null {
  const row = db.prepare(`SELECT value FROM meta WHERE key = ?`).get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

/** Reports index presence, health, and basic counts. Never throws. */
export function indexStatus(dbPath: string): IndexStatus {
  const opened = openHealthy(dbPath);
  if (!opened) {
    return {
      dbPath,
      exists: existsSync(dbPath),
      healthy: false,
      builtAt: null,
      sourceDir: null,
      schemaVersion: null,
      runs: 0,
      steps: 0,
    };
  }
  const { db } = opened;
  try {
    const runs = (db.prepare(`SELECT COUNT(*) AS c FROM runs`).get() as { c: number }).c;
    const steps = (db.prepare(`SELECT COUNT(*) AS c FROM steps`).get() as { c: number }).c;
    const builtAt = meta(db, META_KEYS.builtAt);
    const refreshStatus: IndexStatus["refreshStatus"] =
      runs === 0 ? "fallback-scan" : builtAt ? "complete" : "partial";
    return {
      dbPath,
      exists: true,
      healthy: true,
      builtAt,
      sourceDir: meta(db, META_KEYS.sourceDir),
      schemaVersion: meta(db, META_KEYS.schemaVersion),
      runs,
      steps,
      refreshStatus,
    };
  } finally {
    db.close();
  }
}

/** Returns true when the index is missing, corrupt, or older than any trace. */
export function isIndexStale(dbPath: string, newestTraceMtimeMs: number): boolean {
  const opened = openHealthy(dbPath);
  if (!opened) return true;
  try {
    const builtAt = meta(opened.db, META_KEYS.builtAt);
    if (!builtAt) return true;
    const builtMs = Date.parse(builtAt);
    if (Number.isNaN(builtMs)) return true;
    return newestTraceMtimeMs > builtMs;
  } finally {
    opened.db.close();
  }
}

function mapRow(row: Record<string, unknown>): IndexedRun {
  return {
    runId: row.run_id as string,
    file: row.file as string,
    mtimeMs: row.mtime_ms as number,
    name: (row.name as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    startedAt: (row.started_at as number | null) ?? null,
    endedAt: (row.ended_at as number | null) ?? null,
    durationMs: (row.duration_ms as number | null) ?? null,
    sessionId: (row.session_id as string | null) ?? null,
    groupId: (row.group_id as string | null) ?? null,
    correlationId: (row.correlation_id as string | null) ?? null,
  };
}

/**
 * Queries indexed runs. Returns an empty array when the index is missing or
 * corrupt (the caller should fall back to a directory scan).
 */
export function queryRuns(dbPath: string, query: RunQuery = {}): IndexedRun[] {
  const opened = openHealthy(dbPath);
  if (!opened) return [];
  const { db } = opened;
  try {
    const where: string[] = [];
    const params: Record<string, unknown> = {};

    if (query.status) {
      where.push(`r.status = @status`);
      params.status = query.status;
    }
    if (query.sessionId) {
      where.push(`r.session_id = @sessionId`);
      params.sessionId = query.sessionId;
    }
    if (query.name) {
      where.push(`LOWER(r.name) LIKE @name`);
      params.name = `%${query.name.toLowerCase()}%`;
    }
    if (query.kind) {
      where.push(`EXISTS (SELECT 1 FROM steps s WHERE s.run_id = r.run_id AND s.kind = @kind)`);
      params.kind = query.kind;
    }
    if (query.tool) {
      where.push(
        `EXISTS (SELECT 1 FROM steps s WHERE s.run_id = r.run_id AND LOWER(s.tool_name) LIKE @tool)`,
      );
      params.tool = `%${query.tool.toLowerCase()}%`;
    }

    const limit = Number.isInteger(query.limit) && query.limit! > 0 ? query.limit! : 100;
    const sql = `SELECT r.* FROM runs r ${
      where.length ? `WHERE ${where.join(" AND ")}` : ""
    } ORDER BY r.started_at DESC LIMIT ${limit}`;

    const rows = db.prepare(sql).all(params) as Array<Record<string, unknown>>;
    return rows.map(mapRow);
  } finally {
    db.close();
  }
}
