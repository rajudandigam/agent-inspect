import { readFile } from "node:fs/promises";

import type { LogEventMapping, LogIngestConfig, RedactionRule } from "../types/log-config.js";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyStringArray(v: unknown): v is string[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((x) => typeof x === "string" && x.trim() !== "")
  );
}

function validateRedact(redact: unknown): asserts redact is RedactionRule[] {
  if (!Array.isArray(redact)) {
    throw new Error("Invalid config: redact must be an array");
  }
  for (const r of redact) {
    if (typeof r === "string") continue;
    if (!isRecord(r)) {
      throw new Error("Invalid config: redact entries must be strings or objects");
    }
    if (typeof r.key !== "string" || r.key.trim() === "") {
      throw new Error("Invalid config: redact.key must be a non-empty string");
    }
    if (r.strategy !== "full" && r.strategy !== "prefix" && r.strategy !== "hash") {
      throw new Error(
        `Invalid config: redact.strategy must be one of full, prefix, hash (got ${String(
          r.strategy,
        )})`,
      );
    }
    if (r.keep !== undefined && (typeof r.keep !== "number" || !Number.isFinite(r.keep) || r.keep < 0)) {
      throw new Error("Invalid config: redact.keep must be a non-negative number when provided");
    }
  }
}

function validateMappings(mappings: unknown): asserts mappings is Record<string, LogEventMapping> {
  if (!isRecord(mappings)) {
    throw new Error("Invalid config: mappings must be an object");
  }
}

export const DEFAULT_LOG_INGEST_CONFIG: LogIngestConfig = {
  runIdKeys: ["runId", "traceId", "requestId", "decisionId", "jobId"],
  eventKey: "event",
  timestampKey: "timestamp",
  messageKey: "message",
  levelKey: "level",
  heuristicWindowMs: 2000,
  mappings: {
    "*.error": { kind: "ERROR", status: "error" },
    "*.failed": { kind: "ERROR", status: "error" },
    "*.llm.*": { kind: "LLM" },
    "*.tool.*": { kind: "TOOL" },
    "*.agent.*": { kind: "AGENT" },
    "*.retriever.*": { kind: "RETRIEVER" },
    "*.result.*": { kind: "RESULT" },
  },
};

export function mergeLogIngestConfig(
  base: LogIngestConfig,
  override: Partial<LogIngestConfig>,
): LogIngestConfig {
  const merged: LogIngestConfig = {
    ...base,
    ...override,
    mappings: {
      ...(base.mappings ?? {}),
      ...(override.mappings ?? {}),
    },
  };
  return merged;
}

export async function loadLogIngestConfig(configPath?: string): Promise<LogIngestConfig> {
  if (configPath === undefined || configPath.trim() === "") {
    return DEFAULT_LOG_INGEST_CONFIG;
  }

  let rawText: string;
  try {
    rawText = await readFile(configPath, "utf-8");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to read config file: ${configPath} (${msg})`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON in config file: ${configPath} (${msg})`);
  }

  if (!isRecord(parsed)) {
    throw new Error("Invalid config: expected a JSON object at top-level");
  }

  const user = parsed as Partial<LogIngestConfig>;

  if (user.runIdKeys !== undefined && !isNonEmptyStringArray(user.runIdKeys)) {
    throw new Error("Invalid config: runIdKeys must be a non-empty array of strings");
  }
  if (user.eventKey !== undefined && (typeof user.eventKey !== "string" || user.eventKey.trim() === "")) {
    throw new Error("Invalid config: eventKey must be a non-empty string");
  }

  for (const k of [
    "timestampKey",
    "messageKey",
    "levelKey",
    "parentIdKey",
    "durationKey",
    "statusKey",
  ] as const) {
    const v = (user as any)[k];
    if (v !== undefined && (typeof v !== "string" || v.trim() === "")) {
      throw new Error(`Invalid config: ${k} must be a non-empty string when provided`);
    }
  }

  if (user.mappings !== undefined) {
    validateMappings(user.mappings);
  }
  if (user.redact !== undefined) {
    validateRedact(user.redact);
  }
  if (
    user.heuristicWindowMs !== undefined &&
    (typeof user.heuristicWindowMs !== "number" ||
      !Number.isFinite(user.heuristicWindowMs) ||
      user.heuristicWindowMs < 0)
  ) {
    throw new Error("Invalid config: heuristicWindowMs must be a non-negative number when provided");
  }

  // Explicitly reject obviously unsafe config patterns.
  if ((user as any).redact && JSON.stringify((user as any).redact).includes("=>")) {
    throw new Error("Invalid config: function strings are not supported in redact rules");
  }

  return mergeLogIngestConfig(DEFAULT_LOG_INGEST_CONFIG, user);
}

