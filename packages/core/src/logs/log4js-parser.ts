import { readFile } from "node:fs/promises";

import type { RawLogRecord } from "./raw-record.js";
import type { ParseResult, ParserWarning } from "./warnings.js";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function findLastJsonObjectSubstring(line: string): string | undefined {
  // Scan for balanced {...} regions and keep the last one.
  // This is deliberately conservative: it does not attempt to parse JS object literal syntax.
  let last: { start: number; end: number } | undefined;
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== "{") continue;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let j = i; j < line.length; j++) {
      const ch = line[j]!;
      if (inString) {
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === "\\") {
          escape = true;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;
      if (depth === 0) {
        last = { start: i, end: j + 1 };
        i = j;
        break;
      }
      if (depth < 0) break;
    }
  }
  if (!last) return undefined;
  return line.slice(last.start, last.end);
}

export class Log4jsParser {
  parseLines(lines: string[], filePath?: string): ParseResult<RawLogRecord> {
    const records: RawLogRecord[] = [];
    const warnings: ParserWarning[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const rawLine = lines[i] ?? "";
      const trimmed = rawLine.trim();
      if (trimmed === "") continue;

      const jsonText = findLastJsonObjectSubstring(trimmed);
      if (!jsonText) {
        warnings.push({
          code: "UNSUPPORTED_LOG4JS_PAYLOAD",
          message: "No embedded JSON object found in log4js line",
          file: filePath,
          line: lineNumber,
          raw: trimmed.slice(0, 500),
        });
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText) as unknown;
      } catch {
        warnings.push({
          code: "MALFORMED_JSON",
          message: "Malformed embedded JSON object in log4js line",
          file: filePath,
          line: lineNumber,
          raw: jsonText.slice(0, 500),
        });
        continue;
      }

      if (!isRecord(parsed)) {
        warnings.push({
          code: "UNSUPPORTED_LOG4JS_PAYLOAD",
          message: "Embedded JSON payload must be an object",
          file: filePath,
          line: lineNumber,
          raw: jsonText.slice(0, 500),
        });
        continue;
      }

      records.push({
        raw: parsed,
        file: filePath,
        line: lineNumber,
        sourceType: "log4js",
      });
    }

    return { records, warnings };
  }

  async parseFile(filePath: string): Promise<ParseResult<RawLogRecord>> {
    let text: string;
    try {
      text = await readFile(filePath, "utf-8");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to read log file: ${filePath} (${msg})`);
    }
    const lines = text.split(/\r?\n/);
    return this.parseLines(lines, filePath);
  }
}

