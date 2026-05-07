import { readFile } from "node:fs/promises";

import type { InspectEvent, InspectRunTree } from "../types/inspect-event.js";
import type { LogIngestConfig } from "../types/log-config.js";
import { loadLogIngestConfig, mergeLogIngestConfig } from "./config.js";
import { JsonLogParser } from "./json-parser.js";
import { Log4jsParser } from "./log4js-parser.js";
import type { RawLogRecord } from "./raw-record.js";
import { Redactor } from "./redactor.js";
import { EventNormalizer } from "./normalizer.js";
import { TreeBuilder } from "./tree-builder.js";
import type { ParserWarning } from "./warnings.js";

export interface ParseLogsOptions {
  format?: "json" | "log4js" | "auto";
  config?: LogIngestConfig;
  configPath?: string;
  runIdKeys?: string[];
  eventKey?: string;
  timestampKey?: string;
  messageKey?: string;
  levelKey?: string;
  parentIdKey?: string;
  durationKey?: string;
  statusKey?: string;
  warnings?: "none" | "summary" | "all";
}

export interface LogToTreeResult {
  events: InspectEvent[];
  trees: InspectRunTree[];
  warnings: ParserWarning[];
}

function firstNonEmptyLine(text: string): string | undefined {
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (t !== "") return t;
  }
  return undefined;
}

async function detectFormat(
  filePath: string,
): Promise<"json" | "log4js"> {
  const text = await readFile(filePath, "utf-8");
  const first = firstNonEmptyLine(text);
  if (!first) return "log4js";
  if (!first.startsWith("{")) return "log4js";
  try {
    const parsed = JSON.parse(first) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return "json";
  } catch {
    /* ignore */
  }
  return "log4js";
}

function applyOverrides(
  cfg: LogIngestConfig,
  options: ParseLogsOptions,
): LogIngestConfig {
  const override: Partial<LogIngestConfig> = {};
  for (const k of [
    "runIdKeys",
    "eventKey",
    "timestampKey",
    "messageKey",
    "levelKey",
    "parentIdKey",
    "durationKey",
    "statusKey",
  ] as const) {
    const v = (options as any)[k];
    if (v !== undefined) (override as any)[k] = v;
  }
  return mergeLogIngestConfig(cfg, override);
}

export async function parseLogsToTrees(
  filePath: string,
  options: ParseLogsOptions = {},
): Promise<LogToTreeResult> {
  const base =
    options.config ??
    (await loadLogIngestConfig(options.configPath));
  const config = applyOverrides(base, options);

  const format =
    options.format === "auto" || options.format === undefined
      ? await detectFormat(filePath)
      : options.format;

  let parsed: { records: RawLogRecord[]; warnings: ParserWarning[] };
  if (format === "json") {
    parsed = await new JsonLogParser().parseFile(filePath);
  } else {
    parsed = await new Log4jsParser().parseFile(filePath);
  }

  const normalizer = new EventNormalizer({ config });
  const normalized = normalizer.normalizeAll(parsed.records);

  // Redact attributes after normalization.
  const redactor = new Redactor({ rules: config.redact });
  const events: InspectEvent[] = normalized.records.map((e) => ({
    ...e,
    attributes: e.attributes ? redactor.redactRecord(e.attributes) : undefined,
  }));

  const trees = new TreeBuilder({ config }).build(events);

  return {
    events,
    trees,
    warnings: [...parsed.warnings, ...normalized.warnings],
  };
}

