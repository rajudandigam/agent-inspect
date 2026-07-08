/**
 * `@agent-inspect/index-sqlite` — optional, disposable local SQLite index for
 * faster queries over AgentInspect JSONL traces (v4.1, experimental).
 *
 * @remarks
 * Local-only. The index is derived from JSONL and always safe to delete; trace
 * files are never mutated. No network access. JSONL remains the source of truth.
 */
export {
  INDEX_SCHEMA_VERSION,
  INDEX_DB_FILENAME,
  type IndexedRun,
  type IndexedStep,
  type BuildIndexOptions,
  type BuildIndexResult,
  type IndexStatus,
  type RunQuery,
} from "./types.js";

export {
  buildIndex,
  rebuildIndex,
  cleanIndex,
  resolveIndexDbPath,
} from "./builder.js";

export { indexStatus, isIndexStale, queryRuns } from "./query.js";
