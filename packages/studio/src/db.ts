import { mkdir } from "node:fs/promises";
import path from "node:path";

import Database from "better-sqlite3";

export const STUDIO_DB_SCHEMA_VERSION = "1.0";
export const DEFAULT_STUDIO_DB_FILENAME = "studio.db";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  label TEXT,
  path TEXT NOT NULL,
  workspace_dir TEXT NOT NULL,
  project_name TEXT,
  redaction_profile TEXT,
  trace_count INTEGER NOT NULL DEFAULT 0,
  imported_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  name TEXT,
  status TEXT,
  file TEXT,
  started_at REAL,
  duration_ms REAL,
  session_id TEXT,
  UNIQUE(project_id, run_id)
);
CREATE INDEX IF NOT EXISTS idx_runs_project ON runs(project_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE TABLE IF NOT EXISTS ingest_files (
  source_key TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  dest_path TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('ci', 'bundle')),
  content_hash TEXT NOT NULL,
  imported_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ingest_files_kind ON ingest_files(kind);
`;

export interface StudioProjectRow {
  id: string;
  label: string | null;
  path: string;
  workspaceDir: string;
  projectName: string | null;
  redactionProfile: string | null;
  traceCount: number;
  importedAt: string;
}

export interface StudioRunRow {
  projectId: string;
  runId: string;
  name?: string;
  status?: string;
  file?: string;
  startedAt?: number;
  durationMs?: number;
  sessionId?: string;
}

export type IngestFileKind = "ci" | "bundle";

export interface IngestFileRow {
  sourceKey: string;
  sourceName: string;
  destPath: string;
  kind: IngestFileKind;
  contentHash: string;
  importedAt: string;
}

export function resolveStudioDbPath(options: {
  dbPath?: string;
  cwd?: string;
}): string {
  if (options.dbPath && options.dbPath.trim() !== "") {
    const raw = options.dbPath.trim();
    if (raw.startsWith("postgres://") || raw.startsWith("postgresql://")) {
      return raw;
    }
    return path.resolve(options.cwd ?? process.cwd(), raw);
  }
  return path.resolve(
    options.cwd ?? process.cwd(),
    ".agent-inspect",
    DEFAULT_STUDIO_DB_FILENAME,
  );
}

export function isPostgresDbPath(dbPath: string): boolean {
  return dbPath.startsWith("postgres://") || dbPath.startsWith("postgresql://");
}

export function openStudioDb(dbPath: string): Database.Database {
  if (isPostgresDbPath(dbPath)) {
    throw new Error(
      "Postgres studio databases are not implemented in v6.0.0; use a SQLite file path.",
    );
  }
  const dir = path.dirname(dbPath);
  void mkdir(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA_SQL);
  const insertMeta = db.prepare(
    "INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  insertMeta.run("schemaVersion", STUDIO_DB_SCHEMA_VERSION);
  insertMeta.run("driver", "better-sqlite3");
  return db;
}

export function upsertStudioProject(
  db: Database.Database,
  row: StudioProjectRow,
): void {
  db.prepare(
    `INSERT INTO projects(id, label, path, workspace_dir, project_name, redaction_profile, trace_count, imported_at)
     VALUES (@id, @label, @path, @workspaceDir, @projectName, @redactionProfile, @traceCount, @importedAt)
     ON CONFLICT(id) DO UPDATE SET
       label = excluded.label,
       path = excluded.path,
       workspace_dir = excluded.workspace_dir,
       project_name = excluded.project_name,
       redaction_profile = excluded.redaction_profile,
       trace_count = excluded.trace_count,
       imported_at = excluded.imported_at`,
  ).run({
    id: row.id,
    label: row.label,
    path: row.path,
    workspaceDir: row.workspaceDir,
    projectName: row.projectName,
    redactionProfile: row.redactionProfile,
    traceCount: row.traceCount,
    importedAt: row.importedAt,
  });
}

export function replaceProjectRuns(
  db: Database.Database,
  projectId: string,
  runs: StudioRunRow[],
): void {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM runs WHERE project_id = ?").run(projectId);
    const insert = db.prepare(
      `INSERT INTO runs(project_id, run_id, name, status, file, started_at, duration_ms, session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const run of runs) {
      insert.run(
        projectId,
        run.runId,
        run.name ?? null,
        run.status ?? null,
        run.file ?? null,
        run.startedAt ?? null,
        run.durationMs ?? null,
        run.sessionId ?? null,
      );
    }
  });
  tx();
}

export function listStudioProjects(db: Database.Database): StudioProjectRow[] {
  const rows = db
    .prepare(
      `SELECT id, label, path, workspace_dir AS workspaceDir, project_name AS projectName,
              redaction_profile AS redactionProfile, trace_count AS traceCount, imported_at AS importedAt
       FROM projects ORDER BY id ASC`,
    )
    .all() as StudioProjectRow[];
  return rows;
}

export function getStudioProject(
  db: Database.Database,
  projectId: string,
): StudioProjectRow | undefined {
  return db
    .prepare(
      `SELECT id, label, path, workspace_dir AS workspaceDir, project_name AS projectName,
              redaction_profile AS redactionProfile, trace_count AS traceCount, imported_at AS importedAt
       FROM projects WHERE id = ?`,
    )
    .get(projectId) as StudioProjectRow | undefined;
}

export function listProjectRuns(
  db: Database.Database,
  projectId: string,
  limit = 200,
): StudioRunRow[] {
  const rows = db
    .prepare(
      `SELECT project_id AS projectId, run_id AS runId, name, status, file,
              started_at AS startedAt, duration_ms AS durationMs, session_id AS sessionId
       FROM runs WHERE project_id = ? ORDER BY started_at DESC LIMIT ?`,
    )
    .all(projectId, limit) as StudioRunRow[];
  return rows;
}

export function searchProjectRuns(
  db: Database.Database,
  projectId: string,
  query: string,
  limit = 50,
): StudioRunRow[] {
  const pattern = `%${query}%`;
  return db
    .prepare(
      `SELECT project_id AS projectId, run_id AS runId, name, status, file,
              started_at AS startedAt, duration_ms AS durationMs, session_id AS sessionId
       FROM runs
       WHERE project_id = ?
         AND (run_id LIKE ? OR IFNULL(name, '') LIKE ? OR IFNULL(status, '') LIKE ?)
       ORDER BY started_at DESC
       LIMIT ?`,
    )
    .all(projectId, pattern, pattern, pattern, limit) as StudioRunRow[];
}

export function findIngestFileBySourceKey(
  db: Database.Database,
  sourceKey: string,
): IngestFileRow | undefined {
  return db
    .prepare(
      `SELECT source_key AS sourceKey, source_name AS sourceName, dest_path AS destPath,
              kind, content_hash AS contentHash, imported_at AS importedAt
       FROM ingest_files WHERE source_key = ?`,
    )
    .get(sourceKey) as IngestFileRow | undefined;
}

export function insertIngestFile(db: Database.Database, row: IngestFileRow): void {
  db.prepare(
    `INSERT INTO ingest_files(source_key, source_name, dest_path, kind, content_hash, imported_at)
     VALUES (@sourceKey, @sourceName, @destPath, @kind, @contentHash, @importedAt)
     ON CONFLICT(source_key) DO UPDATE SET
       source_name = excluded.source_name,
       dest_path = excluded.dest_path,
       kind = excluded.kind,
       content_hash = excluded.content_hash,
       imported_at = excluded.imported_at`,
  ).run(row);
}

export function listIngestFiles(
  db: Database.Database,
  kind?: IngestFileKind,
): IngestFileRow[] {
  if (kind) {
    return db
      .prepare(
        `SELECT source_key AS sourceKey, source_name AS sourceName, dest_path AS destPath,
                kind, content_hash AS contentHash, imported_at AS importedAt
         FROM ingest_files WHERE kind = ? ORDER BY imported_at DESC`,
      )
      .all(kind) as IngestFileRow[];
  }
  return db
    .prepare(
      `SELECT source_key AS sourceKey, source_name AS sourceName, dest_path AS destPath,
              kind, content_hash AS contentHash, imported_at AS importedAt
       FROM ingest_files ORDER BY imported_at DESC`,
    )
    .all() as IngestFileRow[];
}
