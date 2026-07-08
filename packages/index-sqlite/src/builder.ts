import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import Database from "better-sqlite3";
import {
  TraceDirectory,
  parseTraceJsonl,
  resolveTraceDir,
  validateEvent,
} from "agent-inspect/advanced";
import type { TraceEvent } from "agent-inspect/advanced";

import {
  DERIVE_SESSIONS_SQL,
  INDEX_SCHEMA_SQL,
  META_KEYS,
  metaDefaults,
} from "./schema.js";
import {
  INDEX_DB_FILENAME,
  type BuildIndexOptions,
  type BuildIndexResult,
  type IndexedRun,
  type IndexedStep,
} from "./types.js";

const DEFAULT_MAX_RUNS = 10_000;

/** Resolves the index database path for a trace directory. */
export function resolveIndexDbPath(traceDir: string, dbPath?: string): string {
  if (dbPath && dbPath.trim() !== "") return path.resolve(dbPath);
  return path.join(path.resolve(traceDir), INDEX_DB_FILENAME);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

interface DerivedRun {
  run: IndexedRun;
  steps: IndexedStep[];
  errors: Array<{ stepId: string | null; message: string | null; code: string | null }>;
}

function deriveRun(file: string, mtimeMs: number, events: TraceEvent[]): DerivedRun | null {
  const started = events.find((e) => e.event === "run_started");
  if (!started || started.event !== "run_started") return null;

  const completed = events.find((e) => e.event === "run_completed");
  const metadata = (started.metadata ?? {}) as Record<string, unknown>;

  const run: IndexedRun = {
    runId: started.runId,
    file,
    mtimeMs,
    name: str(started.name),
    status: completed && completed.event === "run_completed" ? completed.status : null,
    startedAt: num(started.startTime),
    endedAt: completed && completed.event === "run_completed" ? num(completed.endTime) : null,
    durationMs:
      completed && completed.event === "run_completed" ? num(completed.durationMs) : null,
    sessionId: str(metadata.sessionId),
    groupId: str(metadata.groupId),
    correlationId: str(metadata.correlationId),
  };

  const stepStarts = new Map<string, Extract<TraceEvent, { event: "step_started" }>>();
  const steps: IndexedStep[] = [];
  const errors: DerivedRun["errors"] = [];

  if (completed && completed.event === "run_completed" && completed.error) {
    errors.push({
      stepId: null,
      message: str(completed.error.message),
      code: str((completed.error as { code?: unknown }).code),
    });
  }

  for (const event of events) {
    if (event.event === "step_started") {
      stepStarts.set(event.stepId, event);
    }
  }

  for (const event of events) {
    if (event.event !== "step_completed") continue;
    const start = stepStarts.get(event.stepId);
    const meta = (start?.metadata ?? {}) as Record<string, unknown>;
    steps.push({
      runId: run.runId,
      stepId: event.stepId,
      kind: start ? str(start.type) : null,
      name: start ? str(start.name) : null,
      status: event.status,
      durationMs: num(event.durationMs),
      toolName: str(meta.toolName),
      model: str(meta.model),
      parentId: start ? str(start.parentId) : null,
    });
    if (event.error) {
      errors.push({
        stepId: event.stepId,
        message: str(event.error.message),
        code: str((event.error as { code?: unknown }).code),
      });
    }
  }

  return { run, steps, errors };
}

/**
 * Builds (or fully rebuilds) the local SQLite index from a trace directory.
 * Idempotent: rebuilding from identical inputs yields identical contents.
 * Never mutates trace files.
 */
export async function buildIndex(
  options: BuildIndexOptions = {},
): Promise<BuildIndexResult> {
  const traceDir = resolveTraceDir({ dir: options.traceDir });
  const dbPath = resolveIndexDbPath(traceDir, options.dbPath);
  const maxRuns = options.maxRuns ?? DEFAULT_MAX_RUNS;
  const warnings: string[] = [];

  const td = new TraceDirectory({ dir: traceDir });
  const files = await td.list();
  if (files.length > maxRuns) {
    warnings.push(
      `index.truncated: ${files.length} trace files present; indexing first ${maxRuns}`,
    );
  }
  const slice = files.slice(0, maxRuns);

  const derived: DerivedRun[] = [];
  for (const file of slice) {
    try {
      const raw = await readFile(td.getPath(file), "utf-8");
      const parsed = parseTraceJsonl(raw, { validate: validateEvent });
      const stats = await td.getFileStats(file);
      const one = deriveRun(file, stats.mtimeMs, parsed.events);
      if (one) derived.push(one);
      else warnings.push(`index.skipped: ${file} has no run_started event`);
    } catch {
      warnings.push(`index.unreadable: ${file}`);
    }
  }

  await mkdir(path.dirname(dbPath), { recursive: true });
  // Remove any prior (possibly corrupt) file so the rebuild is deterministic.
  await rm(dbPath, { force: true });

  const db = new Database(dbPath);
  let runCount = 0;
  let stepCount = 0;
  let errorCount = 0;
  try {
    db.pragma("journal_mode = WAL");
    db.exec(INDEX_SCHEMA_SQL);

    const insertRun = db.prepare(
      `INSERT INTO runs (run_id, file, mtime_ms, name, status, started_at, ended_at, duration_ms, session_id, group_id, correlation_id)
       VALUES (@runId, @file, @mtimeMs, @name, @status, @startedAt, @endedAt, @durationMs, @sessionId, @groupId, @correlationId)`,
    );
    const insertStep = db.prepare(
      `INSERT INTO steps (run_id, step_id, kind, name, status, duration_ms, tool_name, model, parent_id)
       VALUES (@runId, @stepId, @kind, @name, @status, @durationMs, @toolName, @model, @parentId)`,
    );
    const insertError = db.prepare(
      `INSERT INTO errors (run_id, step_id, message, code) VALUES (@runId, @stepId, @message, @code)`,
    );
    const insertMeta = db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)`);

    const write = db.transaction((items: DerivedRun[]) => {
      const seen = new Set<string>();
      for (const item of items) {
        if (seen.has(item.run.runId)) continue;
        seen.add(item.run.runId);
        insertRun.run(item.run);
        runCount += 1;
        for (const step of item.steps) {
          insertStep.run(step);
          stepCount += 1;
        }
        for (const err of item.errors) {
          insertError.run({ runId: item.run.runId, ...err });
          errorCount += 1;
        }
      }
      db.exec(DERIVE_SESSIONS_SQL);
      for (const [key, value] of Object.entries(metaDefaults(traceDir, slice.length))) {
        insertMeta.run(key, value);
      }
    });
    write(derived);
  } finally {
    db.close();
  }

  const builtAtRow = readMetaValue(dbPath, META_KEYS.builtAt);

  return {
    dbPath,
    traceDir,
    runs: runCount,
    steps: stepCount,
    errors: errorCount,
    builtAt: builtAtRow ?? new Date().toISOString(),
    warnings,
  };
}

/** Alias for {@link buildIndex}; a rebuild is a full, idempotent build. */
export const rebuildIndex = buildIndex;

function readMetaValue(dbPath: string, key: string): string | null {
  try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    try {
      const row = db.prepare(`SELECT value FROM meta WHERE key = ?`).get(key) as
        | { value: string }
        | undefined;
      return row?.value ?? null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

/** Deletes the index database file. Always safe; traces are unaffected. */
export async function cleanIndex(dbPath: string): Promise<void> {
  await rm(dbPath, { force: true });
  await rm(`${dbPath}-wal`, { force: true });
  await rm(`${dbPath}-shm`, { force: true });
}
