import type { RawLogRecord } from "./raw-record.js";
import { JsonLogParser } from "./json-parser.js";
import { Log4jsParser } from "./log4js-parser.js";
import type { ParseResult, ParserWarning } from "./warnings.js";

export type LogSourceFormat = "json" | "log4js" | "auto";

export interface ParseLogLineOptions {
  format?: LogSourceFormat;
  file?: string;
  line?: number;
}

function shiftLineNumbers(
  res: ParseResult<RawLogRecord>,
  options: ParseLogLineOptions,
): ParseResult<RawLogRecord> {
  const targetLine =
    typeof options.line === "number" && Number.isFinite(options.line) && options.line > 0
      ? Math.floor(options.line)
      : undefined;
  const file = typeof options.file === "string" && options.file.trim() !== "" ? options.file : undefined;

  if (targetLine === undefined && file === undefined) return res;

  const mapRecord = (x: RawLogRecord): RawLogRecord => ({
    ...x,
    ...(targetLine !== undefined ? { line: targetLine } : {}),
    ...(file !== undefined ? { file } : {}),
  });

  const mapWarning = (x: ParserWarning): ParserWarning => ({
    ...x,
    ...(targetLine !== undefined ? { line: targetLine } : {}),
    ...(file !== undefined ? { file } : {}),
  });

  return {
    records: res.records.map(mapRecord),
    warnings: res.warnings.map(mapWarning),
  };
}

function normalizeFormat(line: string, format: LogSourceFormat | undefined): LogSourceFormat {
  if (format && format !== "auto") return format;
  const trimmed = line.trim();
  if (trimmed.startsWith("{")) return "json";
  return "log4js";
}

export function parseLogLine(
  line: string,
  options: ParseLogLineOptions = {},
): ParseResult<RawLogRecord> {
  const raw = typeof line === "string" ? line : "";
  const trimmed = raw.trim();
  if (trimmed === "") return { records: [], warnings: [] };

  const format = normalizeFormat(raw, options.format);
  const base =
    format === "json"
      ? new JsonLogParser().parseLines([raw], options.file)
      : new Log4jsParser().parseLines([raw], options.file);

  // JsonLogParser/Log4jsParser always number lines starting at 1; for streaming tail we
  // need to preserve the real stream/file line number when provided.
  return shiftLineNumbers(base, options);
}

