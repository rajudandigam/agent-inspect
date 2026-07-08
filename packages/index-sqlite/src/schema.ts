import { INDEX_SCHEMA_VERSION } from "./types.js";

/**
 * Idempotent DDL for the local trace index. A full rebuild drops and recreates
 * all tables, so building twice from the same inputs yields identical contents.
 */
export const INDEX_SCHEMA_SQL = `
DROP TABLE IF EXISTS meta;
DROP TABLE IF EXISTS errors;
DROP TABLE IF EXISTS steps;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS runs;

CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE runs (
  run_id TEXT PRIMARY KEY,
  file TEXT NOT NULL,
  mtime_ms REAL NOT NULL,
  name TEXT,
  status TEXT,
  started_at REAL,
  ended_at REAL,
  duration_ms REAL,
  session_id TEXT,
  group_id TEXT,
  correlation_id TEXT
);

CREATE TABLE steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  kind TEXT,
  name TEXT,
  status TEXT,
  duration_ms REAL,
  tool_name TEXT,
  model TEXT,
  parent_id TEXT
);

CREATE TABLE errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  step_id TEXT,
  message TEXT,
  code TEXT
);

CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  run_count INTEGER NOT NULL,
  first_started_at REAL,
  last_ended_at REAL
);

CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_session ON runs(session_id);
CREATE INDEX idx_runs_started ON runs(started_at);
CREATE INDEX idx_steps_run ON steps(run_id);
CREATE INDEX idx_steps_kind ON steps(kind);
CREATE INDEX idx_steps_tool ON steps(tool_name);
`;

/** SQL to derive the sessions table from indexed runs. */
export const DERIVE_SESSIONS_SQL = `
INSERT INTO sessions (session_id, run_count, first_started_at, last_ended_at)
SELECT session_id, COUNT(*), MIN(started_at), MAX(ended_at)
FROM runs
WHERE session_id IS NOT NULL
GROUP BY session_id;
`;

export const META_KEYS = {
  schemaVersion: "schemaVersion",
  builtAt: "builtAt",
  sourceDir: "sourceDir",
  fileCount: "fileCount",
  driver: "driver",
} as const;

export function metaDefaults(sourceDir: string, fileCount: number) {
  return {
    [META_KEYS.schemaVersion]: INDEX_SCHEMA_VERSION,
    [META_KEYS.builtAt]: new Date().toISOString(),
    [META_KEYS.sourceDir]: sourceDir,
    [META_KEYS.fileCount]: String(fileCount),
    [META_KEYS.driver]: "better-sqlite3",
  } as Record<string, string>;
}
