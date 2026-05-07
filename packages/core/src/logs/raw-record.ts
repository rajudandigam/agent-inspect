export interface RawLogRecord {
  raw: Record<string, unknown>;
  file?: string;
  line: number;
  sourceType: "json-log" | "log4js";
}

