import { appendFile, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { TraceEvent } from "./types.js";
import { isStepType } from "./types.js";
import {
  DEFAULT_MAX_EVENT_BYTES,
  prepareTraceEventForDisk,
  resolveTraceSafetyOptions,
} from "./trace-event-safety.js";
import { parseTraceJsonl } from "./read-trace.js";
import {
  ensureTraceDir,
  FALLBACK_TRACE_DIR,
  getTraceFilePath,
  warn,
} from "./utils.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function optionalErrorInfo(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  if (typeof value.message !== "string") return false;
  if ("stack" in value && value.stack !== undefined) {
    if (typeof value.stack !== "string") return false;
  }
  return true;
}

/**
 * Strict MVP validation before writing JSONL. Rejects empty ids, non-finite times, and malformed payloads.
 */
export function validateEvent(event: unknown): event is TraceEvent {
  if (!isRecord(event)) return false;
  if (event.schemaVersion !== "0.1") return false;
  if (!finiteNumber(event.timestamp)) return false;
  if (typeof event.event !== "string") return false;

  switch (event.event) {
    case "run_started": {
      if (
        !nonEmptyString(event.runId) ||
        !nonEmptyString(event.name) ||
        !finiteNumber(event.startTime)
      ) {
        return false;
      }
      if (event.metadata !== undefined && !isRecord(event.metadata)) {
        return false;
      }
      return true;
    }
    case "run_completed": {
      return (
        nonEmptyString(event.runId) &&
        (event.status === "success" || event.status === "error") &&
        finiteNumber(event.endTime) &&
        finiteNumber(event.durationMs) &&
        optionalErrorInfo(event.error)
      );
    }
    case "step_started": {
      if (
        !nonEmptyString(event.runId) ||
        !nonEmptyString(event.stepId) ||
        !nonEmptyString(event.name) ||
        !isStepType(event.type) ||
        !finiteNumber(event.startTime)
      ) {
        return false;
      }
      if (event.parentId !== undefined && typeof event.parentId !== "string") {
        return false;
      }
      if (event.metadata !== undefined && !isRecord(event.metadata)) {
        return false;
      }
      return true;
    }
    case "step_completed": {
      return (
        nonEmptyString(event.runId) &&
        nonEmptyString(event.stepId) &&
        (event.status === "success" || event.status === "error") &&
        finiteNumber(event.endTime) &&
        finiteNumber(event.durationMs) &&
        optionalErrorInfo(event.error)
      );
    }
    default:
      return false;
  }
}

/** Serializes a trace line as compact JSON without a trailing newline. */
export function serializeEvent(event: TraceEvent): string {
  try {
    return JSON.stringify(event);
  } catch {
    return "";
  }
}

/**
 * Creates (or truncates) an empty JSONL file for a run. Uses {@link ensureTraceDir} then {@link getTraceFilePath}.
 * On failure, retries once under {@link FALLBACK_TRACE_DIR}.
 */
export async function initializeTraceFile(
  runId: string,
  traceDir: string,
): Promise<string | undefined> {
  try {
    const usable = await ensureTraceDir(traceDir);
    const filePath = getTraceFilePath(runId, usable);
    await writeFile(filePath, "", "utf-8");
    return filePath;
  } catch (e) {
    warn("Failed to initialize trace file", e);
  }

  try {
    const usable = await ensureTraceDir(FALLBACK_TRACE_DIR);
    const filePath = getTraceFilePath(runId, usable);
    await writeFile(filePath, "", "utf-8");
    return filePath;
  } catch (e) {
    warn("Failed to initialize trace file on fallback directory", e);
    return undefined;
  }
}

/**
 * Appends one validated JSONL line for `event.runId`. Falls back to {@link FALLBACK_TRACE_DIR} on append failure.
 */
function ensureEventWithinBounds(event: TraceEvent): TraceEvent {
  const line = serializeEvent(event);
  if (line === "") return event;
  const bytes = Buffer.byteLength(line, "utf8");
  if (bytes <= DEFAULT_MAX_EVENT_BYTES) return event;
  return prepareTraceEventForDisk(event, resolveTraceSafetyOptions());
}

export async function writeTraceEvent(
  event: TraceEvent,
  traceDir: string,
): Promise<void> {
  const bounded = ensureEventWithinBounds(event);

  if (!validateEvent(bounded)) {
    warn("Skipped invalid trace event (validation failed)");
    return;
  }

  const line = serializeEvent(bounded);
  if (line === "") {
    warn("Skipped trace event (serialization failed)");
    return;
  }

  const payload = `${line}\n`;

  const tryAppend = async (dir: string): Promise<boolean> => {
    try {
      const usable = await ensureTraceDir(dir);
      const filePath = getTraceFilePath(event.runId, usable);
      await appendFile(filePath, payload, "utf-8");
      return true;
    } catch {
      return false;
    }
  };

  if (await tryAppend(traceDir)) {
    return;
  }

  warn(`Failed to append trace event for run ${event.runId}`);

  if (await tryAppend(FALLBACK_TRACE_DIR)) {
    return;
  }

  warn("Failed to append trace event to fallback directory");
}

/**
 * Reads raw JSONL file contents for a run, or `undefined` if missing or unreadable.
 */
export async function readTraceFile(
  runId: string,
  traceDir: string,
): Promise<string | undefined> {
  try {
    const filePath = getTraceFilePath(runId, traceDir);
    return await readFile(filePath, "utf-8");
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return undefined;
    }
    warn("Unexpected error reading trace file", e);
    return undefined;
  }
}

/**
 * Parses JSONL into validated {@link TraceEvent} rows (v0.1 native or v0.2 normalized).
 * Invalid lines are skipped with a warning.
 */
export async function readTraceEvents(
  runId: string,
  traceDir: string,
): Promise<TraceEvent[]> {
  try {
    const raw = await readTraceFile(runId, traceDir);
    if (raw === undefined) {
      return [];
    }
    return parseTraceJsonl(raw, { validate: validateEvent }).events;
  } catch (e) {
    warn("Failed to read trace events", e);
    return [];
  }
}

/**
 * Lists `.jsonl` file names in `traceDir`, newest by mtime first (name sort as tie-breaker).
 */
export async function listTraceFiles(traceDir: string): Promise<string[]> {
  try {
    const usable = path.resolve(traceDir);
    const names = await readdir(usable);
    const jsonl = names.filter((n) => n.endsWith(".jsonl"));
    const withStat = await Promise.all(
      jsonl.map(async (name) => {
        try {
          const st = await stat(path.join(usable, name));
          return { name, mtime: st.mtimeMs };
        } catch {
          return { name, mtime: 0 };
        }
      }),
    );
    withStat.sort((a, b) => {
      if (b.mtime !== a.mtime) return b.mtime - a.mtime;
      return a.name.localeCompare(b.name);
    });
    return withStat.map((x) => x.name);
  } catch {
    return [];
  }
}

/** Maps a `.jsonl` file name to its run id (basename only; no traversal). */
export function getRunIdFromTraceFileName(fileName: string): string | undefined {
  try {
    const base = path.basename(fileName);
    if (!base.endsWith(".jsonl")) return undefined;
    const id = base.slice(0, -".jsonl".length);
    return id === "" ? undefined : id;
  } catch {
    return undefined;
  }
}
