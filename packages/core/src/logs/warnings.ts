export type ParserWarningCode =
  | "MALFORMED_JSON"
  | "MISSING_RUN_ID"
  | "MISSING_EVENT"
  | "MISSING_TIMESTAMP"
  | "UNSUPPORTED_LOG4JS_PAYLOAD"
  | "CONFIG_ERROR"
  | "UNKNOWN";

export interface ParserWarning {
  code: ParserWarningCode;
  message: string;
  file?: string;
  line?: number;
  raw?: string;
}

export interface ParseResult<T> {
  records: T[];
  warnings: ParserWarning[];
}

