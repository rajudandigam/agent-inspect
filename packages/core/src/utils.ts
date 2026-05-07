import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { nanoid } from "nanoid";

import type { ErrorInfo } from "./types.js";
import { formatDuration as formatDurationV2 } from "./utils/duration.js";

/** Default folder under the user home for AgentInspect data. */
export const DEFAULT_TRACE_DIR_NAME = ".agent-inspect";

/** Subfolder where JSONL run traces are stored. */
export const RUNS_DIR_NAME = "runs";

/** Writable trace root when the default home path cannot be used. */
export const FALLBACK_TRACE_DIR = path.join(
  os.tmpdir(),
  "agent-inspect",
  RUNS_DIR_NAME,
);

/** Maximum display length for run/step names before truncation. */
export const MAX_NAME_LENGTH = 100;

/** Returns `run_` + a 10-character nanoid segment. */
export function createRunId(): string {
  return `run_${nanoid(10)}`;
}

/** Returns `step_` + a 10-character nanoid segment. */
export function createStepId(): string {
  return `step_${nanoid(10)}`;
}

/** Formats a duration for CLI display (v0.2 rules). */
export function formatDuration(ms: number): string {
  return formatDurationV2(ms);
}

/**
 * Formats a Unix timestamp (ms) as local `YYYY-MM-DD HH:mm:ss`.
 * Invalid values yield `"Invalid date"` (no throw).
 */
export function formatTimestamp(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return "Invalid date";
  }
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) {
    return "Invalid date";
  }
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${day} ${h}:${min}:${s}`;
}

/**
 * Default directory for trace files: `~/DEFAULT_TRACE_DIR_NAME/RUNS_DIR_NAME`.
 * Falls back to {@link FALLBACK_TRACE_DIR} when home cannot be resolved.
 */
export function getDefaultTraceDir(): string {
  const envDir = process.env.AGENT_INSPECT_TRACE_DIR;
  if (typeof envDir === "string" && envDir.trim() !== "") {
    return envDir.trim();
  }
  try {
    const home = os.homedir();
    if (typeof home !== "string" || home.trim() === "") {
      return FALLBACK_TRACE_DIR;
    }
    return path.join(home, DEFAULT_TRACE_DIR_NAME, RUNS_DIR_NAME);
  } catch {
    return FALLBACK_TRACE_DIR;
  }
}

/**
 * Full path to the JSONL trace file for a run.
 * `runId` is passed through `path.basename` to avoid traversal; empty ids become `run_unknown`.
 */
export function getTraceFilePath(runId: string, traceDir?: string): string {
  const baseDir = traceDir ?? getDefaultTraceDir();
  let safeId =
    typeof runId === "string" && runId.trim() !== "" ? runId.trim() : "run_unknown";
  safeId = path.basename(safeId);
  if (safeId === "" || safeId === "." || safeId === "..") {
    safeId = "run_unknown";
  }
  return path.join(baseDir, `${safeId}.jsonl`);
}

/**
 * Ensures a trace directory exists (recursive). Tries {@link FALLBACK_TRACE_DIR} on failure.
 * Returns the directory path that callers should prefer: primary, fallback, or original if both mkdir attempts fail.
 * Emits concise `[AgentInspect]` warnings on failure; never throws.
 */
export async function ensureTraceDir(traceDir: string): Promise<string> {
  const primary = path.resolve(traceDir);
  try {
    await mkdir(primary, { recursive: true });
    return primary;
  } catch {
    warn(`Failed to create trace directory: ${primary}`);
    const fallback = path.resolve(FALLBACK_TRACE_DIR);
    try {
      await mkdir(fallback, { recursive: true });
      return fallback;
    } catch {
      warn(`Failed to create fallback trace directory: ${fallback}`);
      return primary;
    }
  }
}

/**
 * Normalizes any thrown/caught value into {@link ErrorInfo}.
 * Never throws (circular structures and non-JSON values fall back to a generic message).
 */
export function formatError(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    const out: ErrorInfo = { message: error.message };
    if (typeof error.stack === "string" && error.stack.length > 0) {
      out.stack = error.stack;
    }
    return out;
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (error === null) {
    return { message: "Unknown error: null" };
  }
  if (error === undefined) {
    return { message: "Unknown error: undefined" };
  }
  if (
    typeof error === "number" ||
    typeof error === "boolean" ||
    typeof error === "bigint"
  ) {
    return { message: String(error) };
  }
  if (typeof error === "object") {
    try {
      return { message: JSON.stringify(error) };
    } catch {
      return { message: "Unknown error" };
    }
  }
  return { message: "Unknown error" };
}

/**
 * Truncates a display name to `maxLength`, appending `"..."` when shortened.
 * Empty or non-string input becomes `"unnamed"`.
 */
export function truncateName(name: string, maxLength = MAX_NAME_LENGTH): string {
  if (typeof name !== "string" || name.trim() === "") {
    return "unnamed";
  }
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  const ellipsis = "...";
  const head = Math.max(0, maxLength - ellipsis.length);
  return `${trimmed.slice(0, head)}${ellipsis}`;
}

/**
 * Instrumentation-only warning to stderr. Not a general-purpose logger.
 * Optional `error` is summarized via {@link formatError} (message only).
 */
export function warn(message: string, error?: unknown): void {
  const base = `[AgentInspect] ${message}`;
  if (error === undefined) {
    console.warn(base);
    return;
  }
  console.warn(`${base}: ${formatError(error).message}`);
}
