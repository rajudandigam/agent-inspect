import { nanoid } from "nanoid";

import type { InspectEvent, InspectKind } from "../types/inspect-event.js";
import type { LogIngestConfig } from "../types/log-config.js";
import type { RawLogRecord } from "./raw-record.js";
import type { ParseResult, ParserWarning } from "./warnings.js";
import { matchMapping } from "./mapping.js";

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function safeString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

function parseTimestamp(v: unknown): number | undefined {
  if (isFiniteNumber(v)) return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (Number.isFinite(t)) return t;
  }
  return undefined;
}

function hasToken(hay: string, token: string): boolean {
  return hay.includes(token);
}

// "error"/"failed" must be a complete dot-delimited token ("x.error",
// "x.failed.y"); substrings like "error_budget" or "error_retry" are not
// error signals.
const ERROR_TOKEN_RE = /\.(error|failed)(\.|$)/;

function inferKind(eventName: string): InspectKind {
  if (hasToken(eventName, ".llm.")) return "LLM";
  if (hasToken(eventName, ".tool.")) return "TOOL";
  if (hasToken(eventName, ".agent.")) return "AGENT";
  if (hasToken(eventName, ".retriever.")) return "RETRIEVER";
  if (hasToken(eventName, ".result.")) return "RESULT";
  if (ERROR_TOKEN_RE.test(eventName)) {
    return "ERROR";
  }
  return "LOG";
}

function deriveName(eventName: string, kind: InspectKind): string {
  const parts = eventName.split(".");
  const last = parts[parts.length - 1] ?? eventName;
  if (kind === "LLM") return `llm:${last}`;
  if (kind === "TOOL") return `tool:${last}`;
  if (kind === "AGENT") return `agent:${last}`;
  if (kind === "RESULT") return `result:${last}`;
  if (kind === "RUN") return `run:${last}`;
  if (kind === "RETRIEVER") return `retriever:${last}`;
  if (kind === "ERROR") return `error:${last}`;
  return eventName;
}

export interface NormalizeOptions {
  config: LogIngestConfig;
  sourceFile?: string;
}

export class EventNormalizer {
  readonly #config: LogIngestConfig;

  constructor(options: NormalizeOptions) {
    this.#config = options.config;
  }

  #normalizeInternal(
    record: RawLogRecord,
  ): { event?: InspectEvent; warning?: ParserWarning } {
    const raw = record.raw;
    const cfg = this.#config;

    // runId
    let runId: string | undefined;
    for (const k of cfg.runIdKeys) {
      const v = raw[k];
      const s = safeString(v);
      if (s) {
        runId = s;
        break;
      }
    }
    if (!runId) {
      return {
        warning: {
        code: "MISSING_RUN_ID",
        message: "Missing run id (none of runIdKeys present)",
        file: record.file,
        line: record.line,
        },
      };
    }

    // event name
    const eventName = safeString(raw[cfg.eventKey]);
    if (!eventName) {
      return {
        warning: {
        code: "MISSING_EVENT",
        message: `Missing event name (key: ${cfg.eventKey})`,
        file: record.file,
        line: record.line,
        },
      };
    }

    const mapping = matchMapping(eventName, cfg.mappings);

    // timestamp
    const tsKey = cfg.timestampKey ?? "timestamp";
    const tsRaw = raw[tsKey];
    const parsedTs = parseTimestamp(tsRaw);
    const timestamp = parsedTs ?? Date.now();
    const timestampMissing = parsedTs === undefined;

    // parentId
    const parentIdKey = cfg.parentIdKey;
    const parentId = parentIdKey ? safeString(raw[parentIdKey]) : undefined;

    // duration
    let durationMs: number | undefined;
    const durationKey = cfg.durationKey;
    if (durationKey) {
      const v = raw[durationKey];
      if (isFiniteNumber(v)) durationMs = v;
    } else if (isFiniteNumber((raw as any).durationMs)) {
      durationMs = (raw as any).durationMs as number;
    }

    // status
    let status: InspectEvent["status"] | undefined;
    const statusKey = cfg.statusKey;
    const statusRaw = statusKey ? safeString(raw[statusKey]) : undefined;
    if (statusRaw === "running" || statusRaw === "ok" || statusRaw === "error") {
      status = statusRaw;
    } else if (mapping?.status) {
      status = mapping.status;
    } else if (mapping?.kind === "ERROR") {
      status = "error";
    } else if (ERROR_TOKEN_RE.test(eventName)) {
      status = "error";
    } else if (mapping?.startsRun || mapping?.startsStep) {
      status = "running";
    } else if (mapping?.endsRun || mapping?.endsStep) {
      status = "ok";
    }

    // kind
    const kind: InspectKind = mapping?.kind ?? inferKind(eventName);

    // name
    const name = mapping?.name ?? deriveName(eventName, kind);

    // confidence
    let confidence: InspectEvent["confidence"] = "correlated";
    if (parentId || mapping?.startsRun) confidence = "explicit";
    if (timestampMissing) confidence = "unknown";

    // attributes: exclude used keys
    const omit = new Set<string>([
      ...cfg.runIdKeys,
      cfg.eventKey,
      tsKey,
      cfg.messageKey ?? "message",
      cfg.levelKey ?? "level",
      cfg.parentIdKey ?? "",
      cfg.durationKey ?? "",
      cfg.statusKey ?? "",
      "durationMs",
    ].filter((k) => k !== ""));

    const attributes: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (omit.has(k)) continue;
      attributes[k] = v;
    }

    const event: InspectEvent = {
      eventId: nanoid(10),
      runId,
      ...(parentId ? { parentId } : {}),
      name,
      kind,
      timestamp,
      ...(status ? { status } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
      confidence,
      source: {
        type: record.sourceType,
        file: record.file,
        line: record.line,
      },
    };

    if (timestampMissing) {
      return {
        event,
        warning: {
          code: "MISSING_TIMESTAMP",
          message: `Missing or invalid timestamp (key: ${tsKey})`,
          file: record.file,
          line: record.line,
          raw: JSON.stringify(raw).slice(0, 500),
        },
      };
    }

    return { event };
  }

  normalize(record: RawLogRecord): InspectEvent | ParserWarning {
    const r = this.#normalizeInternal(record);
    return r.event ?? (r.warning as ParserWarning);
  }

  normalizeAll(records: RawLogRecord[]): ParseResult<InspectEvent> {
    const out: InspectEvent[] = [];
    const warnings: ParserWarning[] = [];
    for (const r of records) {
      const normalized = this.#normalizeInternal(r);
      if (normalized.event) out.push(normalized.event);
      if (normalized.warning) warnings.push(normalized.warning);
    }
    return { records: out, warnings };
  }
}

