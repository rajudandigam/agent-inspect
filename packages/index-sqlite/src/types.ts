/**
 * Public types for the optional local SQLite trace index (v4.1, experimental).
 *
 * @remarks
 * Local-only. The index is derived from JSONL traces and is always safe to
 * delete. Trace files are never mutated. No network access.
 */

/** Current index schema version. Bumped when table layout changes. */
export const INDEX_SCHEMA_VERSION = "1" as const;

/** Default index database filename. */
export const INDEX_DB_FILENAME = "trace-index.sqlite";

/** A derived run row in the index. */
export interface IndexedRun {
  runId: string;
  file: string;
  mtimeMs: number;
  name: string | null;
  status: string | null;
  startedAt: number | null;
  endedAt: number | null;
  durationMs: number | null;
  sessionId: string | null;
  groupId: string | null;
  correlationId: string | null;
}

/** A derived step row in the index. */
export interface IndexedStep {
  runId: string;
  stepId: string;
  kind: string | null;
  name: string | null;
  status: string | null;
  durationMs: number | null;
  toolName: string | null;
  model: string | null;
  parentId: string | null;
}

/** Options for building/rebuilding the index. */
export interface BuildIndexOptions {
  /** Trace directory to index. Resolved via core `resolveTraceDir` when omitted. */
  traceDir?: string;
  /** Index database path. Defaults to `<traceDir>/<INDEX_DB_FILENAME>`. */
  dbPath?: string;
  /** Cap on the number of trace files indexed (default 10000). */
  maxRuns?: number;
}

/** Result of a build/rebuild. */
export interface BuildIndexResult {
  dbPath: string;
  traceDir: string;
  runs: number;
  steps: number;
  errors: number;
  builtAt: string;
  warnings: string[];
}

/** Status of an existing index. */
export interface IndexStatus {
  dbPath: string;
  exists: boolean;
  healthy: boolean;
  builtAt: string | null;
  sourceDir: string | null;
  schemaVersion: string | null;
  runs: number;
  steps: number;
  /** Derived lifecycle: complete, partial, stale, or fallback-scan */
  refreshStatus?: "complete" | "partial" | "stale" | "fallback-scan";
}

/** Filter for querying indexed runs. */
export interface RunQuery {
  status?: string;
  sessionId?: string;
  /** Case-insensitive substring match on run name. */
  name?: string;
  /** Match runs that contain a step of this kind. */
  kind?: string;
  /** Match runs that contain a step with this tool name (substring). */
  tool?: string;
  limit?: number;
}
