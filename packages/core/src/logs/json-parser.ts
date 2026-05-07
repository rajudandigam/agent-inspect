import { readFile } from "node:fs/promises";

import type { RawLogRecord } from "./raw-record.js";
import type { ParseResult, ParserWarning } from "./warnings.js";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export class JsonLogParser {
  parseLines(lines: string[], filePath?: string): ParseResult<RawLogRecord> {
    const records: RawLogRecord[] = [];
    const warnings: ParserWarning[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const raw = lines[i] ?? "";
      const trimmed = raw.trim();
      if (trimmed === "") continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed) as unknown;
      } catch {
        warnings.push({
          code: "MALFORMED_JSON",
          message: "Malformed JSON log line",
          file: filePath,
          line: lineNumber,
          raw: trimmed.slice(0, 500),
        });
        continue;
      }
      if (!isRecord(parsed)) {
        warnings.push({
          code: "MALFORMED_JSON",
          message: "JSON log line must be an object",
          file: filePath,
          line: lineNumber,
          raw: trimmed.slice(0, 500),
        });
        continue;
      }
      records.push({
        raw: parsed,
        file: filePath,
        line: lineNumber,
        sourceType: "json-log",
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

