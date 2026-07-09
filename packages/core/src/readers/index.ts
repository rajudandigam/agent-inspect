import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { parseTraceJsonl, type TraceJsonlFormat } from "../read-trace.js";
import {
  traceEventToPersistedInspectEvent,
  traceEventsToPersistedInspectEvents,
} from "../persisted/from-trace-event.js";
import { persistedInspectEventsToRunTrees } from "../persisted/tree-bridge.js";
import type { InspectRunTree } from "../types/inspect-event.js";
import type {
  PersistedEventStatus,
  PersistedInspectEvent,
  PersistedTokenUsage,
} from "../types/persisted-inspect-event.js";

export type TraceInput =
  | { type: "file"; path: string }
  | { type: "directory"; path: string }
  | { type: "string"; content: string }
  | { type: "buffer"; content: Buffer }
  | { type: "stdin" };

export type TraceReadWarningSeverity = "info" | "warning" | "error";

export interface TraceReadWarning {
  code: string;
  message: string;
  severity?: TraceReadWarningSeverity;
  sourceFile?: string;
  line?: number;
  field?: string;
}

export interface TraceReadResult {
  format: string;
  events: PersistedInspectEvent[];
  runs: InspectRunTree[];
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
  sourceFiles: string[];
}

export interface TraceFormatCandidate {
  format: string;
  confidence: number;
  readerName?: string;
  description?: string;
  warnings?: TraceReadWarning[];
}

export type TraceFormatDetectionStatus =
  | "detected"
  | "ambiguous"
  | "unsupported";

export interface TraceFormatDetectionResult {
  status: TraceFormatDetectionStatus;
  format?: string;
  candidates: TraceFormatCandidate[];
  warnings: TraceReadWarning[];
}

export interface TraceReaderDetectOptions {
  format?: string;
}

export interface TraceReaderReadOptions {
  format?: string;
}

export interface TraceReader {
  readonly format: string;
  readonly name?: string;
  detect(
    input: TraceInput,
    options?: TraceReaderDetectOptions,
  ): TraceFormatCandidate | undefined | Promise<TraceFormatCandidate | undefined>;
  read(
    input: TraceInput,
    options?: TraceReaderReadOptions,
  ): TraceReadResult | Promise<TraceReadResult>;
}

export interface TraceReadOptions {
  format?: string;
  readers?: readonly TraceReader[];
}

interface ResolvedTraceInput {
  content: string;
  sourceFiles: string[];
}

interface OpenInferenceDocument {
  spans: JsonRecord[];
  confidence: number;
  description: string;
  version?: string;
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
}

interface OpenInferenceMappedSpan {
  event: PersistedInspectEvent;
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
  spanId: string;
  parentSpanId?: string;
}

interface OtlpDocument {
  spans: OtlpSpanContext[];
  confidence: number;
  description: string;
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
}

interface OtlpSpanContext {
  span: JsonRecord;
  resourceAttributes: Record<string, unknown>;
  scopeAttributes: Record<string, unknown>;
  scopeName?: string;
  scopeVersion?: string;
  pathPrefix: string;
}

type JsonRecord = Record<string, unknown>;

const DEFAULT_MAX_TRACE_INPUT_BYTES = 10 * 1024 * 1024;
const MIN_DETECTION_CONFIDENCE = 0.5;
const AMBIGUOUS_CONFIDENCE_DELTA = 0.05;
const resolvedInputCache = new WeakMap<TraceInput, Promise<ResolvedTraceInput | undefined>>();
const OPENINFERENCE_READER_FORMAT = "openinference-json";
const OTLP_READER_FORMAT = "otlp-json";

const OPENINFERENCE_SPAN_KEYS = new Set([
  "trace_id",
  "traceId",
  "span_id",
  "spanId",
  "parent_span_id",
  "parentSpanId",
  "name",
  "start_time_unix_nano",
  "startTimeUnixNano",
  "end_time_unix_nano",
  "endTimeUnixNano",
  "start_time",
  "startTime",
  "end_time",
  "endTime",
  "attributes",
  "status",
  "kind",
  "span_kind",
  "spanKind",
]);

const OPENINFERENCE_SENSITIVE_ATTRIBUTE_KEYS = [
  "input.value",
  "output.value",
  "input.mime_type",
  "output.mime_type",
  "llm.input_messages",
  "llm.output_messages",
  "llm.prompts",
  "llm.completions",
  "retrieval.documents",
  "reranker.input_documents",
  "reranker.output_documents",
  "document.content",
  "gen_ai.prompt",
  "gen_ai.completion",
  "gen_ai.input.messages",
  "gen_ai.output.messages",
];

const OTLP_SPAN_KEYS = new Set([
  "traceId",
  "spanId",
  "parentSpanId",
  "name",
  "kind",
  "startTimeUnixNano",
  "endTimeUnixNano",
  "attributes",
  "events",
  "status",
  "droppedAttributesCount",
  "droppedEventsCount",
  "droppedLinksCount",
  "links",
  "flags",
]);

export type TraceReadErrorCode =
  | "unsupported_format"
  | "ambiguous_format"
  | "reader_failed";

export class TraceReadError extends Error {
  readonly code: TraceReadErrorCode;
  readonly warnings: TraceReadWarning[];

  constructor(
    code: TraceReadErrorCode,
    message: string,
    warnings: TraceReadWarning[] = [],
  ) {
    super(message);
    this.name = "TraceReadError";
    this.code = code;
    this.warnings = warnings;
  }
}

function normalizeCandidate(
  reader: TraceReader,
  candidate: TraceFormatCandidate,
): TraceFormatCandidate {
  const confidence = Number.isFinite(candidate.confidence)
    ? Math.max(0, Math.min(1, candidate.confidence))
    : 0;

  return {
    ...candidate,
    format: candidate.format || reader.format,
    confidence,
    readerName: candidate.readerName ?? reader.name,
  };
}

function sortCandidates(
  candidates: readonly TraceFormatCandidate[],
): TraceFormatCandidate[] {
  return [...candidates].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.format.localeCompare(b.format);
  });
}

function collectWarnings(
  candidates: readonly TraceFormatCandidate[],
): TraceReadWarning[] {
  return candidates.flatMap((candidate) => candidate.warnings ?? []);
}

function dedupeWarnings(
  warnings: readonly TraceReadWarning[],
): TraceReadWarning[] {
  const seen = new Set<string>();
  const out: TraceReadWarning[] = [];
  for (const warning of warnings) {
    const key = [
      warning.code,
      warning.message,
      warning.severity ?? "",
      warning.sourceFile ?? "",
      warning.line ?? "",
      warning.field ?? "",
    ].join("\u0000");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(warning);
  }
  return out;
}

function attachSingleSourceFile(
  warnings: readonly TraceReadWarning[],
  resolved: ResolvedTraceInput,
): TraceReadWarning[] {
  if (resolved.sourceFiles.length !== 1) return [...warnings];
  const [sourceFile] = resolved.sourceFiles;
  return warnings.map((warning) => ({
    ...warning,
    sourceFile: warning.sourceFile ?? sourceFile,
  }));
}

function findReaderByFormat(
  format: string,
  readers: readonly TraceReader[],
): TraceReader | undefined {
  return readers.find((reader) => reader.format === format);
}

async function jsonlFilesInDirectory(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
    .map((entry) => path.join(dirPath, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

async function resolveInput(input: TraceInput): Promise<ResolvedTraceInput | undefined> {
  const cached = resolvedInputCache.get(input);
  if (cached) return cached;

  const promise = resolveInputUncached(input);
  resolvedInputCache.set(input, promise);
  return promise;
}

function assertInputWithinBounds(content: string, sourceFile?: string): void {
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes <= DEFAULT_MAX_TRACE_INPUT_BYTES) return;
  throw new TraceReadError("unsupported_format", "Trace input exceeds the local reader size limit.", [
    {
      code: "input_too_large",
      message: `Trace input is ${bytes} bytes; max is ${DEFAULT_MAX_TRACE_INPUT_BYTES} bytes.`,
      severity: "error",
      ...(sourceFile !== undefined ? { sourceFile } : {}),
    },
  ]);
}

async function resolveInputUncached(
  input: TraceInput,
): Promise<ResolvedTraceInput | undefined> {
  if (input.type === "string") {
    assertInputWithinBounds(input.content);
    return { content: input.content, sourceFiles: [] };
  }
  if (input.type === "buffer") {
    const content = input.content.toString("utf-8");
    assertInputWithinBounds(content);
    return { content, sourceFiles: [] };
  }
  if (input.type === "file") {
    const content = await readFile(input.path, "utf-8");
    assertInputWithinBounds(content, input.path);
    return { content, sourceFiles: [input.path] };
  }
  if (input.type === "directory") {
    const files = await jsonlFilesInDirectory(input.path);
    const parts = await Promise.all(
      files.map(async (file) => (await readFile(file, "utf-8")).trimEnd()),
    );
    const content = parts.filter((part) => part.trim() !== "").join("\n");
    assertInputWithinBounds(content, input.path);
    return {
      content,
      sourceFiles: files,
    };
  }
  return undefined;
}

function detectJsonlFormat(content: string): {
  format: TraceJsonlFormat;
  validRows: number;
  warnings: TraceReadWarning[];
} {
  let saw01 = false;
  let saw02 = false;
  let saw10 = false;
  let validRows = 0;
  let invalidJsonRows = 0;
  let unknownSchemaRows = 0;
  let firstInvalidJsonLine: number | undefined;
  let firstUnknownSchemaLine: number | undefined;

  let lineNumber = 0;
  for (const line of content.split(/\r?\n/)) {
    lineNumber += 1;
    const trimmed = line.trim();
    if (trimmed === "") continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      invalidJsonRows += 1;
      firstInvalidJsonLine ??= lineNumber;
      continue;
    }

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      "schemaVersion" in parsed
    ) {
      const version = (parsed as { schemaVersion?: unknown }).schemaVersion;
      if (version === "0.1") {
        saw01 = true;
        validRows += 1;
        continue;
      }
      if (version === "0.2") {
        saw02 = true;
        validRows += 1;
        continue;
      }
      if (version === "1.0") {
        saw10 = true;
        validRows += 1;
        continue;
      }
    }

    unknownSchemaRows += 1;
    firstUnknownSchemaLine ??= lineNumber;
  }

  const warnings: TraceReadWarning[] = [];
  if (invalidJsonRows > 0) {
    warnings.push({
      code: "invalid_jsonl_rows",
      message: `Skipped ${invalidJsonRows} invalid JSONL row(s) during format detection.`,
      severity: "warning",
      ...(firstInvalidJsonLine !== undefined ? { line: firstInvalidJsonLine } : {}),
    });
  }
  if (unknownSchemaRows > 0) {
    warnings.push({
      code: "unknown_schema_rows",
      message: `Skipped ${unknownSchemaRows} row(s) with unknown schemaVersion during format detection.`,
      severity: "warning",
      ...(firstUnknownSchemaLine !== undefined ? { line: firstUnknownSchemaLine } : {}),
    });
  }

  let format: TraceJsonlFormat = "empty";
  const seenFormats = [saw01, saw02, saw10].filter(Boolean).length;
  if (seenFormats > 1) format = "mixed";
  else if (saw01) format = "0.1";
  else if (saw02) format = "0.2";
  else if (saw10) format = "1.0";

  return { format, validRows, warnings };
}

function agentInspectFormatLabel(format: TraceJsonlFormat): string {
  switch (format) {
    case "0.1":
      return "agent-inspect-v0.1-jsonl";
    case "0.2":
      return "agent-inspect-v0.2-jsonl";
    case "1.0":
      return "agent-inspect-v1.0-jsonl";
    case "mixed":
      return "agent-inspect-mixed-jsonl";
    default:
      return "agent-inspect-jsonl";
  }
}

function persistedEventsForParsedTrace(
  parsed: ReturnType<typeof parseTraceJsonl>,
): PersistedInspectEvent[] {
  if (
    (parsed.format === "0.2" || parsed.format === "1.0") &&
    parsed.persisted.length > 0
  ) {
    return [...parsed.persisted];
  }
  if (parsed.format === "mixed" && parsed.rows.length > 0) {
    return parsed.rows.map((row, index) => {
      if (row.format === "0.2" || row.format === "1.0") return row.event;
      return traceEventToPersistedInspectEvent(row.event, {
        eventIndex: index,
        sourceName: "agent-inspect-jsonl-reader",
      });
    });
  }
  return traceEventsToPersistedInspectEvents(parsed.events, {
    sourceName: "agent-inspect-jsonl-reader",
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function readStringField(
  record: JsonRecord,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (isNonEmptyString(value)) return value;
  }
  return undefined;
}

function readRecordField(
  record: JsonRecord,
  key: string,
): JsonRecord | undefined {
  const value = record[key];
  return isRecord(value) ? value : undefined;
}

function parseJsonDocument(content: string): unknown {
  return JSON.parse(content) as unknown;
}

function looksLikeOpenInferenceSpan(value: unknown): value is JsonRecord {
  if (!isRecord(value)) return false;
  const attributes = readRecordField(value, "attributes");
  return (
    readStringField(value, ["trace_id", "traceId"]) !== undefined &&
    readStringField(value, ["span_id", "spanId"]) !== undefined &&
    (readStringField(value, ["name"]) !== undefined ||
      attributes?.["openinference.span.kind"] !== undefined)
  );
}

function extractOpenInferenceDocument(root: unknown): OpenInferenceDocument | undefined {
  const warnings: TraceReadWarning[] = [];
  const unsupportedFields: string[] = [];

  if (Array.isArray(root)) {
    const spans = root.filter(looksLikeOpenInferenceSpan);
    if (spans.length === 0) return undefined;
    if (spans.length !== root.length) {
      warnings.push({
        code: "openinference_skipped_items",
        message: "Skipped non-span item(s) in OpenInference span array.",
        severity: "warning",
      });
    }
    return {
      spans,
      confidence: 0.82,
      description: "OpenInference span array",
      warnings,
      unsupportedFields,
    };
  }

  if (!isRecord(root)) return undefined;

  const rootFormat = root.format;
  const rootCompatibility = root.compatibility;
  const version =
    typeof root.version === "string" && root.version.trim() !== ""
      ? root.version
      : undefined;

  if (Array.isArray(root.spans)) {
    const spans = root.spans.filter(looksLikeOpenInferenceSpan);
    if (spans.length === 0 && (rootFormat === "openinference" || rootCompatibility === "openinference-compatible")) {
      warnings.push({
        code: "openinference_no_valid_spans",
        message: "OpenInference document did not contain any valid spans.",
        severity: "error",
      });
      return {
        spans,
        confidence: 0.7,
        description: "Malformed OpenInference document",
        version,
        warnings,
        unsupportedFields,
      };
    }
    if (spans.length === 0) return undefined;
    if (spans.length !== root.spans.length) {
      warnings.push({
        code: "openinference_skipped_spans",
        message: "Skipped invalid OpenInference span item(s).",
        severity: "warning",
      });
    }
    return {
      spans,
      confidence:
        rootFormat === "openinference" || rootCompatibility === "openinference-compatible"
          ? 0.9
          : 0.84,
      description:
        rootFormat === "openinference" || rootCompatibility === "openinference-compatible"
          ? "OpenInference document"
          : "OpenInference spans document",
      version,
      warnings,
      unsupportedFields,
    };
  }

  if (Array.isArray(root.data)) {
    const spans = root.data.filter(looksLikeOpenInferenceSpan);
    if (spans.length === 0) return undefined;
    if (spans.length !== root.data.length) {
      warnings.push({
        code: "openinference_skipped_data_items",
        message: "Skipped non-span item(s) in OpenInference data array.",
        severity: "warning",
      });
    }
    return {
      spans,
      confidence: 0.8,
      description: "OpenInference data document",
      version,
      warnings,
      unsupportedFields,
    };
  }

  if (looksLikeOpenInferenceSpan(root)) {
    return {
      spans: [root],
      confidence: 0.76,
      description: "OpenInference single span",
      version,
      warnings,
      unsupportedFields,
    };
  }

  if (rootFormat === "openinference" || rootCompatibility === "openinference-compatible") {
    warnings.push({
      code: "openinference_missing_spans",
      message: "OpenInference document is missing a spans array.",
      severity: "error",
    });
    return {
      spans: [],
      confidence: 0.7,
      description: "Malformed OpenInference document",
      version,
      warnings,
      unsupportedFields,
    };
  }

  return undefined;
}

function parseUnixNanoToIso(value: unknown): string | undefined {
  if (typeof value === "bigint" && value >= 0n) {
    return new Date(Number(value / 1_000_000n)).toISOString();
  }
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return new Date(Math.floor(value / 1_000_000)).toISOString();
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return new Date(Number(BigInt(value) / 1_000_000n)).toISOString();
  }
  return undefined;
}

function parseIsoTime(value: unknown): string | undefined {
  if (!isNonEmptyString(value)) return undefined;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return undefined;
  return new Date(ms).toISOString();
}

function readOpenInferenceTimestamp(
  span: JsonRecord,
  nanoKeys: readonly string[],
  isoKeys: readonly string[],
): string | undefined {
  for (const key of nanoKeys) {
    const iso = parseUnixNanoToIso(span[key]);
    if (iso !== undefined) return iso;
  }
  for (const key of isoKeys) {
    const iso = parseIsoTime(span[key]);
    if (iso !== undefined) return iso;
  }
  return undefined;
}

function durationBetweenIso(startedAt?: string, endedAt?: string): number | undefined {
  if (startedAt === undefined || endedAt === undefined) return undefined;
  const startMs = Date.parse(startedAt);
  const endMs = Date.parse(endedAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return undefined;
  }
  return endMs - startMs;
}

function isSensitiveOpenInferenceAttribute(key: string): boolean {
  return OPENINFERENCE_SENSITIVE_ATTRIBUTE_KEYS.some(
    (sensitiveKey) =>
      key === sensitiveKey ||
      key.startsWith(`${sensitiveKey}.`) ||
      key.endsWith(".message.content") ||
      key.endsWith(".document.content"),
  );
}

function summarizeAttributeValue(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    return { type: "string", length: value.length };
  }
  if (typeof value === "number") {
    return { type: "number", finite: Number.isFinite(value) };
  }
  if (typeof value === "boolean") {
    return { type: "boolean" };
  }
  if (Array.isArray(value)) {
    return { type: "array", length: value.length };
  }
  if (isRecord(value)) {
    return { type: "object", keyCount: Object.keys(value).length };
  }
  if (value === null) {
    return { type: "null" };
  }
  return { type: typeof value };
}

function sanitizeOpenInferenceAttributes(
  attributes: JsonRecord,
  pathPrefix: string,
): {
  attributes: Record<string, unknown>;
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
} {
  const out: Record<string, unknown> = {};
  const warnings: TraceReadWarning[] = [];
  const unsupportedFields: string[] = [];
  const summarizedKeys: string[] = [];

  for (const [key, value] of Object.entries(attributes)) {
    if (isSensitiveOpenInferenceAttribute(key)) {
      summarizedKeys.push(key);
      out[`${key}.summary`] = summarizeAttributeValue(value);
      unsupportedFields.push(`${pathPrefix}.attributes.${key}`);
      continue;
    }
    out[key] = value;
  }

  if (summarizedKeys.length > 0) {
    out["openinference.summarized_attributes"] = summarizedKeys;
    warnings.push({
      code: "openinference_sensitive_attribute_summarized",
      message:
        "OpenInference prompt/output/document attribute(s) were summarized instead of copied verbatim.",
      severity: "warning",
    });
  }

  return { attributes: out, warnings, unsupportedFields };
}

function mapOpenInferenceKind(
  span: JsonRecord,
  attributes: JsonRecord,
  pathPrefix: string,
): { kind: PersistedInspectEvent["kind"]; warnings: TraceReadWarning[] } {
  const warnings: TraceReadWarning[] = [];
  const agentInspectKind = attributes["agent_inspect.kind"];
  if (
    agentInspectKind === "RUN" ||
    agentInspectKind === "AGENT" ||
    agentInspectKind === "LLM" ||
    agentInspectKind === "TOOL" ||
    agentInspectKind === "CHAIN" ||
    agentInspectKind === "RETRIEVER" ||
    agentInspectKind === "DECISION" ||
    agentInspectKind === "RESULT" ||
    agentInspectKind === "ERROR" ||
    agentInspectKind === "LOGIC" ||
    agentInspectKind === "LOG" ||
    agentInspectKind === "OUTCOME"
  ) {
    return { kind: agentInspectKind, warnings };
  }

  const rawKind =
    readStringField(span, ["kind", "span_kind", "spanKind"]) ??
    (typeof attributes["openinference.span.kind"] === "string"
      ? attributes["openinference.span.kind"]
      : undefined);
  const normalized = rawKind?.toUpperCase();

  switch (normalized) {
    case "LLM":
      return { kind: "LLM", warnings };
    case "TOOL":
      return { kind: "TOOL", warnings };
    case "CHAIN":
      return { kind: "CHAIN", warnings };
    case "RETRIEVER":
      return { kind: "RETRIEVER", warnings };
    case "AGENT":
      return { kind: "AGENT", warnings };
    case "EMBEDDING":
      warnings.push({
        code: "openinference_kind_semantic_loss",
        message: "OpenInference EMBEDDING span kind mapped to AgentInspect LLM.",
        severity: "warning",
        field: `${pathPrefix}.attributes.openinference.span.kind`,
      });
      return { kind: "LLM", warnings };
    case "RERANKER":
      warnings.push({
        code: "openinference_kind_semantic_loss",
        message: "OpenInference RERANKER span kind mapped to AgentInspect RETRIEVER.",
        severity: "warning",
        field: `${pathPrefix}.attributes.openinference.span.kind`,
      });
      return { kind: "RETRIEVER", warnings };
    case "UNKNOWN":
    case undefined:
      warnings.push({
        code: "openinference_kind_unknown",
        message: "OpenInference span kind was missing or unknown; mapped to AgentInspect LOGIC.",
        severity: "warning",
        field: `${pathPrefix}.attributes.openinference.span.kind`,
      });
      return { kind: "LOGIC", warnings };
    default:
      warnings.push({
        code: "openinference_kind_unsupported",
        message: `Unsupported OpenInference span kind "${rawKind}" mapped to AgentInspect LOGIC.`,
        severity: "warning",
        field: `${pathPrefix}.attributes.openinference.span.kind`,
      });
      return { kind: "LOGIC", warnings };
  }
}

function mapOpenInferenceStatus(status: unknown): PersistedEventStatus | undefined {
  if (!isRecord(status)) return undefined;
  const rawCode = status.code;
  if (typeof rawCode !== "string") return undefined;
  switch (rawCode.toUpperCase()) {
    case "OK":
      return "ok";
    case "ERROR":
      return "error";
    case "UNSET":
      return "unknown";
    default:
      return "unknown";
  }
}

function readOpenInferenceTokenUsage(
  attributes: JsonRecord,
): PersistedTokenUsage | undefined {
  const prompt = attributes["llm.token_count.prompt"];
  const completion = attributes["llm.token_count.completion"];
  const total = attributes["llm.token_count.total"];
  const cached = attributes["llm.token_count.prompt_details.cache_read"];
  const usage: PersistedTokenUsage = {};

  if (typeof prompt === "number" && Number.isFinite(prompt) && prompt >= 0) {
    usage.input = prompt;
  }
  if (
    typeof completion === "number" &&
    Number.isFinite(completion) &&
    completion >= 0
  ) {
    usage.output = completion;
  }
  if (typeof total === "number" && Number.isFinite(total) && total >= 0) {
    usage.total = total;
  }
  if (typeof cached === "number" && Number.isFinite(cached) && cached >= 0) {
    usage.cached = cached;
  }
  if (usage.total === undefined && usage.input !== undefined && usage.output !== undefined) {
    usage.total = usage.input + usage.output;
  }

  return Object.keys(usage).length > 0 ? usage : undefined;
}

function readOpenInferenceConfidence(
  attributes: JsonRecord,
): PersistedInspectEvent["confidence"] {
  const confidence = attributes["agent_inspect.confidence"];
  if (
    confidence === "explicit" ||
    confidence === "correlated" ||
    confidence === "heuristic" ||
    confidence === "unknown"
  ) {
    return confidence;
  }
  return "correlated";
}

function mapOpenInferenceSpan(
  span: JsonRecord,
  index: number,
  version?: string,
): OpenInferenceMappedSpan {
  const pathPrefix = `spans[${index}]`;
  const warnings: TraceReadWarning[] = [];
  const unsupportedFields: string[] = [];
  const rawAttributes = readRecordField(span, "attributes") ?? {};
  const sanitized = sanitizeOpenInferenceAttributes(rawAttributes, pathPrefix);
  warnings.push(...sanitized.warnings);
  unsupportedFields.push(...sanitized.unsupportedFields);

  const attributes: Record<string, unknown> = { ...sanitized.attributes };
  for (const [key, value] of Object.entries(span)) {
    if (OPENINFERENCE_SPAN_KEYS.has(key)) continue;
    unsupportedFields.push(`${pathPrefix}.${key}`);
    if (value === null || typeof value !== "object") {
      attributes[`openinference.${key}`] = value;
    } else {
      attributes[`openinference.${key}.summary`] = summarizeAttributeValue(value);
      warnings.push({
        code: "openinference_unsupported_field_summarized",
        message: `Unsupported OpenInference span field "${key}" was summarized.`,
        severity: "warning",
        field: `${pathPrefix}.${key}`,
      });
    }
  }

  const traceId = readStringField(span, ["trace_id", "traceId"]) ?? `trace-${index}`;
  const spanId = readStringField(span, ["span_id", "spanId"]) ?? `span-${index}`;
  const parentSpanId = readStringField(span, ["parent_span_id", "parentSpanId"]);
  const name = readStringField(span, ["name"]) ?? spanId;
  const startedAt = readOpenInferenceTimestamp(
    span,
    ["start_time_unix_nano", "startTimeUnixNano"],
    ["start_time", "startTime"],
  );
  const endedAt = readOpenInferenceTimestamp(
    span,
    ["end_time_unix_nano", "endTimeUnixNano"],
    ["end_time", "endTime"],
  );
  const timestamp = startedAt ?? "1970-01-01T00:00:00.000Z";

  if (startedAt === undefined) {
    warnings.push({
      code: "openinference_missing_start_time",
      message: "OpenInference span is missing a valid start time; using Unix epoch.",
      severity: "warning",
      field: `${pathPrefix}.start_time_unix_nano`,
    });
    unsupportedFields.push(`${pathPrefix}.start_time_unix_nano`);
  }

  const { kind, warnings: kindWarnings } = mapOpenInferenceKind(
    span,
    rawAttributes,
    pathPrefix,
  );
  warnings.push(...kindWarnings);
  const status = mapOpenInferenceStatus(span.status);
  const tokenUsage = readOpenInferenceTokenUsage(rawAttributes);
  const errorMessage =
    isRecord(span.status) && typeof span.status.message === "string"
      ? span.status.message
      : undefined;

  const event: PersistedInspectEvent = {
    schemaVersion: "0.2",
    eventId:
      typeof rawAttributes["agent_inspect.event_id"] === "string"
        ? rawAttributes["agent_inspect.event_id"]
        : spanId,
    runId:
      typeof rawAttributes["agent_inspect.run_id"] === "string"
        ? rawAttributes["agent_inspect.run_id"]
        : traceId,
    kind,
    name,
    timestamp,
    confidence: readOpenInferenceConfidence(rawAttributes),
    source: {
      type: "otel",
      name: "openinference",
      ...(version !== undefined ? { version } : {}),
    },
    attributes,
    trace: {
      traceId,
      spanId,
      ...(parentSpanId !== undefined ? { parentSpanId } : {}),
    },
  };

  if (status !== undefined) {
    event.status = status;
  }
  if (startedAt !== undefined) {
    event.startedAt = startedAt;
  }
  if (endedAt !== undefined) {
    event.endedAt = endedAt;
  }
  const durationMs = durationBetweenIso(startedAt, endedAt);
  if (durationMs !== undefined) {
    event.durationMs = durationMs;
  }
  if (tokenUsage !== undefined) {
    event.tokenUsage = tokenUsage;
  }
  if (status === "error") {
    event.error = {
      message: errorMessage !== undefined && errorMessage.trim() !== "" ? errorMessage : "OpenInference span error",
    };
  }

  return {
    event,
    warnings,
    unsupportedFields,
    spanId,
    ...(parentSpanId !== undefined ? { parentSpanId } : {}),
  };
}

function mapOpenInferenceEvents(document: OpenInferenceDocument): {
  events: PersistedInspectEvent[];
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
} {
  const mapped = document.spans.map((span, index) =>
    mapOpenInferenceSpan(span, index, document.version),
  );
  const spanIdToEventId = new Map(
    mapped.map((span) => [span.spanId, span.event.eventId] as const),
  );
  for (const span of mapped) {
    if (span.parentSpanId === undefined) continue;
    span.event.parentId = spanIdToEventId.get(span.parentSpanId) ?? span.parentSpanId;
  }

  return {
    events: mapped.map((span) => span.event),
    warnings: mapped.flatMap((span) => span.warnings),
    unsupportedFields: mapped.flatMap((span) => span.unsupportedFields),
  };
}

export const openInferenceJsonReader: TraceReader = {
  format: OPENINFERENCE_READER_FORMAT,
  name: "OpenInference JSON",
  async detect(input) {
    const resolved = await resolveInput(input);
    if (!resolved) return undefined;

    let parsed: unknown;
    try {
      parsed = parseJsonDocument(resolved.content);
    } catch {
      return undefined;
    }

    const document = extractOpenInferenceDocument(parsed);
    if (!document) return undefined;

    return {
      format: OPENINFERENCE_READER_FORMAT,
      confidence: document.confidence,
      readerName: "OpenInference JSON",
      description: document.description,
      warnings: attachSingleSourceFile(document.warnings, resolved),
    };
  },
  async read(input) {
    const resolved = await resolveInput(input);
    if (!resolved) {
      throw new TraceReadError(
        "unsupported_format",
        "OpenInference JSON reader requires file, string, or buffer input.",
      );
    }

    let parsed: unknown;
    try {
      parsed = parseJsonDocument(resolved.content);
    } catch {
      throw new TraceReadError("unsupported_format", "OpenInference JSON input is not valid JSON.", [
        {
          code: "openinference_invalid_json",
          message: "OpenInference JSON reader could not parse the input as JSON.",
          severity: "error",
        },
      ]);
    }

    const document = extractOpenInferenceDocument(parsed);
    if (!document || document.spans.length === 0) {
      throw new TraceReadError(
        "unsupported_format",
        "No valid OpenInference spans found.",
        attachSingleSourceFile(
          document?.warnings ?? [
            {
              code: "openinference_no_valid_spans",
              message: "OpenInference JSON input did not contain valid spans.",
              severity: "error",
            },
          ],
          resolved,
        ),
      );
    }

    const mapped = mapOpenInferenceEvents(document);
    const warnings = attachSingleSourceFile(
      [...document.warnings, ...mapped.warnings],
      resolved,
    );
    const unsupportedFields = [
      ...document.unsupportedFields,
      ...mapped.unsupportedFields,
    ].sort((a, b) => a.localeCompare(b));

    return {
      format: OPENINFERENCE_READER_FORMAT,
      events: mapped.events,
      runs: persistedInspectEventsToRunTrees(mapped.events, { skipInvalid: true }),
      warnings,
      unsupportedFields,
      sourceFiles: resolved.sourceFiles,
    };
  },
};

function parseOtlpAnyValue(
  value: unknown,
  field: string,
  warnings: TraceReadWarning[],
  unsupportedFields: string[],
): unknown {
  if (!isRecord(value)) {
    unsupportedFields.push(field);
    warnings.push({
      code: "otlp_attribute_value_invalid",
      message: "OTLP attribute value was not an AnyValue object.",
      severity: "warning",
      field,
    });
    return undefined;
  }
  if (typeof value.stringValue === "string") return value.stringValue;
  if (typeof value.boolValue === "boolean") return value.boolValue;
  if (typeof value.intValue === "number" && Number.isFinite(value.intValue)) {
    return value.intValue;
  }
  if (typeof value.intValue === "string" && value.intValue.trim() !== "") {
    const n = Number(value.intValue);
    if (Number.isFinite(n)) return n;
  }
  if (
    typeof value.doubleValue === "number" &&
    Number.isFinite(value.doubleValue)
  ) {
    return value.doubleValue;
  }
  if (isRecord(value.arrayValue) && Array.isArray(value.arrayValue.values)) {
    return value.arrayValue.values.map((item, index) =>
      parseOtlpAnyValue(item, `${field}.arrayValue.values[${index}]`, warnings, unsupportedFields),
    );
  }
  if (isRecord(value.kvlistValue) && Array.isArray(value.kvlistValue.values)) {
    const out: Record<string, unknown> = {};
    for (const [index, item] of value.kvlistValue.values.entries()) {
      if (!isRecord(item) || typeof item.key !== "string") {
        unsupportedFields.push(`${field}.kvlistValue.values[${index}]`);
        continue;
      }
      out[item.key] = parseOtlpAnyValue(
        item.value,
        `${field}.kvlistValue.values[${index}].value`,
        warnings,
        unsupportedFields,
      );
    }
    return out;
  }
  if (typeof value.bytesValue === "string") {
    unsupportedFields.push(field);
    warnings.push({
      code: "otlp_bytes_value_summarized",
      message: "OTLP bytesValue attribute was summarized instead of decoded.",
      severity: "warning",
      field,
    });
    return { type: "bytes", length: value.bytesValue.length };
  }

  unsupportedFields.push(field);
  warnings.push({
    code: "otlp_attribute_value_unsupported",
    message: "OTLP attribute value used an unsupported AnyValue shape.",
    severity: "warning",
    field,
  });
  return undefined;
}

function parseOtlpAttributes(
  value: unknown,
  pathPrefix: string,
): {
  attributes: Record<string, unknown>;
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
} {
  const attributes: Record<string, unknown> = {};
  const warnings: TraceReadWarning[] = [];
  const unsupportedFields: string[] = [];

  if (value === undefined) {
    return { attributes, warnings, unsupportedFields };
  }
  if (!Array.isArray(value)) {
    unsupportedFields.push(pathPrefix);
    warnings.push({
      code: "otlp_attributes_invalid",
      message: "OTLP attributes field was not an array.",
      severity: "warning",
      field: pathPrefix,
    });
    return { attributes, warnings, unsupportedFields };
  }

  for (const [index, item] of value.entries()) {
    const field = `${pathPrefix}[${index}]`;
    if (!isRecord(item) || typeof item.key !== "string") {
      unsupportedFields.push(field);
      warnings.push({
        code: "otlp_attribute_invalid",
        message: "Skipped OTLP attribute without a string key.",
        severity: "warning",
        field,
      });
      continue;
    }
    const parsed = parseOtlpAnyValue(
      item.value,
      `${field}.value`,
      warnings,
      unsupportedFields,
    );
    if (parsed !== undefined) {
      attributes[item.key] = parsed;
    }
  }

  return { attributes, warnings, unsupportedFields };
}

function looksLikeOtlpSpan(value: unknown): value is JsonRecord {
  return (
    isRecord(value) &&
    readStringField(value, ["traceId"]) !== undefined &&
    readStringField(value, ["spanId"]) !== undefined &&
    readStringField(value, ["name"]) !== undefined
  );
}

function extractOtlpDocument(root: unknown): OtlpDocument | undefined {
  if (!isRecord(root) || !Array.isArray(root.resourceSpans)) return undefined;

  const spans: OtlpSpanContext[] = [];
  const warnings: TraceReadWarning[] = [];
  const unsupportedFields: string[] = [];

  for (const [resourceIndex, resourceSpan] of root.resourceSpans.entries()) {
    const resourcePath = `resourceSpans[${resourceIndex}]`;
    if (!isRecord(resourceSpan)) {
      unsupportedFields.push(resourcePath);
      continue;
    }

    const resource = readRecordField(resourceSpan, "resource");
    const resourceParsed = parseOtlpAttributes(
      resource?.attributes,
      `${resourcePath}.resource.attributes`,
    );
    warnings.push(...resourceParsed.warnings);
    unsupportedFields.push(...resourceParsed.unsupportedFields);

    if (!Array.isArray(resourceSpan.scopeSpans)) {
      unsupportedFields.push(`${resourcePath}.scopeSpans`);
      warnings.push({
        code: "otlp_scope_spans_missing",
        message: "OTLP resourceSpans entry did not contain a scopeSpans array.",
        severity: "warning",
        field: `${resourcePath}.scopeSpans`,
      });
      continue;
    }

    for (const [scopeIndex, scopeSpan] of resourceSpan.scopeSpans.entries()) {
      const scopePath = `${resourcePath}.scopeSpans[${scopeIndex}]`;
      if (!isRecord(scopeSpan)) {
        unsupportedFields.push(scopePath);
        continue;
      }
      const scope = readRecordField(scopeSpan, "scope");
      const scopeParsed = parseOtlpAttributes(
        scope?.attributes,
        `${scopePath}.scope.attributes`,
      );
      warnings.push(...scopeParsed.warnings);
      unsupportedFields.push(...scopeParsed.unsupportedFields);
      if (!Array.isArray(scopeSpan.spans)) {
        unsupportedFields.push(`${scopePath}.spans`);
        warnings.push({
          code: "otlp_spans_missing",
          message: "OTLP scopeSpans entry did not contain a spans array.",
          severity: "warning",
          field: `${scopePath}.spans`,
        });
        continue;
      }

      for (const [spanIndex, span] of scopeSpan.spans.entries()) {
        const spanPath = `${scopePath}.spans[${spanIndex}]`;
        if (!looksLikeOtlpSpan(span)) {
          unsupportedFields.push(spanPath);
          warnings.push({
            code: "otlp_invalid_span",
            message: "Skipped OTLP span without required traceId, spanId, or name.",
            severity: "warning",
            field: spanPath,
          });
          continue;
        }
        spans.push({
          span,
          resourceAttributes: resourceParsed.attributes,
          scopeAttributes: scopeParsed.attributes,
          scopeName: readStringField(scope ?? {}, ["name"]),
          scopeVersion: readStringField(scope ?? {}, ["version"]),
          pathPrefix: spanPath,
        });
      }
    }
  }

  if (spans.length === 0) {
    warnings.push({
      code: "otlp_no_valid_spans",
      message: "OTLP JSON payload did not contain any valid spans.",
      severity: "error",
    });
    return {
      spans,
      confidence: 0.7,
      description: "Malformed OTLP JSON trace payload",
      warnings,
      unsupportedFields,
    };
  }

  return {
    spans,
    confidence: 0.93,
    description: "OTLP JSON trace payload",
    warnings,
    unsupportedFields,
  };
}

function mapOtlpStatus(status: unknown): PersistedEventStatus | undefined {
  if (!isRecord(status)) return undefined;
  const rawCode = status.code;
  if (typeof rawCode !== "string") return undefined;
  switch (rawCode.toUpperCase()) {
    case "STATUS_CODE_OK":
    case "OK":
      return "ok";
    case "STATUS_CODE_ERROR":
    case "ERROR":
      return "error";
    case "STATUS_CODE_UNSET":
    case "UNSET":
      return "unknown";
    default:
      return "unknown";
  }
}

function readOtlpKind(
  attributes: JsonRecord,
  pathPrefix: string,
): { kind: PersistedInspectEvent["kind"]; warnings: TraceReadWarning[] } {
  const warnings: TraceReadWarning[] = [];
  const agentInspectKind = attributes["agent_inspect.kind"];
  if (
    agentInspectKind === "RUN" ||
    agentInspectKind === "AGENT" ||
    agentInspectKind === "LLM" ||
    agentInspectKind === "TOOL" ||
    agentInspectKind === "CHAIN" ||
    agentInspectKind === "RETRIEVER" ||
    agentInspectKind === "DECISION" ||
    agentInspectKind === "RESULT" ||
    agentInspectKind === "ERROR" ||
    agentInspectKind === "LOGIC" ||
    agentInspectKind === "LOG" ||
    agentInspectKind === "OUTCOME"
  ) {
    return { kind: agentInspectKind, warnings };
  }

  const operation = attributes["gen_ai.operation.name"];
  if (typeof operation === "string") {
    switch (operation) {
      case "generate_content":
      case "chat":
        return { kind: "LLM", warnings };
      case "execute_tool":
        return { kind: "TOOL", warnings };
      case "invoke_agent":
        return { kind: "AGENT", warnings };
      default:
        warnings.push({
          code: "otlp_gen_ai_operation_semantic_loss",
          message: `OTLP GenAI operation "${operation}" mapped to AgentInspect LOGIC.`,
          severity: "warning",
          field: `${pathPrefix}.attributes.gen_ai.operation.name`,
        });
        return { kind: "LOGIC", warnings };
    }
  }

  warnings.push({
    code: "otlp_kind_unknown",
    message: "OTLP span had no AgentInspect kind or GenAI operation; mapped to LOGIC.",
    severity: "warning",
    field: `${pathPrefix}.attributes`,
  });
  return { kind: "LOGIC", warnings };
}

function readOtlpTokenUsage(attributes: JsonRecord): PersistedTokenUsage | undefined {
  const input = attributes["gen_ai.usage.input_tokens"];
  const output = attributes["gen_ai.usage.output_tokens"];
  const usage: PersistedTokenUsage = {};
  if (typeof input === "number" && Number.isFinite(input) && input >= 0) {
    usage.input = input;
  }
  if (typeof output === "number" && Number.isFinite(output) && output >= 0) {
    usage.output = output;
  }
  if (usage.input !== undefined && usage.output !== undefined) {
    usage.total = usage.input + usage.output;
  }
  return Object.keys(usage).length > 0 ? usage : undefined;
}

function readOtlpConfidence(
  attributes: JsonRecord,
): PersistedInspectEvent["confidence"] {
  return readOpenInferenceConfidence(attributes);
}

function sanitizeOtlpAttributes(
  attributes: JsonRecord,
  pathPrefix: string,
): {
  attributes: Record<string, unknown>;
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
} {
  const ownerPath = pathPrefix.endsWith(".attributes")
    ? pathPrefix.slice(0, -".attributes".length)
    : pathPrefix;
  const sanitized = sanitizeOpenInferenceAttributes(attributes, ownerPath);
  return {
    ...sanitized,
    warnings: sanitized.warnings.map((warning) =>
      warning.code === "openinference_sensitive_attribute_summarized"
        ? {
            ...warning,
            code: "otlp_sensitive_attribute_summarized",
            message:
              "OTLP prompt/output/document attribute(s) were summarized instead of copied verbatim.",
          }
        : warning,
    ),
  };
}

function mapOtlpEvents(
  value: unknown,
  pathPrefix: string,
): {
  events?: Record<string, unknown>[];
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
} {
  const warnings: TraceReadWarning[] = [];
  const unsupportedFields: string[] = [];
  if (value === undefined) return { warnings, unsupportedFields };
  if (!Array.isArray(value)) {
    unsupportedFields.push(pathPrefix);
    warnings.push({
      code: "otlp_events_invalid",
      message: "OTLP events field was not an array.",
      severity: "warning",
      field: pathPrefix,
    });
    return { warnings, unsupportedFields };
  }

  const events: Record<string, unknown>[] = [];
  for (const [index, event] of value.entries()) {
    const eventPath = `${pathPrefix}[${index}]`;
    if (!isRecord(event)) {
      unsupportedFields.push(eventPath);
      continue;
    }
    const parsedAttributes = parseOtlpAttributes(
      event.attributes,
      `${eventPath}.attributes`,
    );
    warnings.push(...parsedAttributes.warnings);
    unsupportedFields.push(...parsedAttributes.unsupportedFields);
    const sanitized = sanitizeOtlpAttributes(
      parsedAttributes.attributes,
      `${eventPath}.attributes`,
    );
    warnings.push(...sanitized.warnings);
    unsupportedFields.push(...sanitized.unsupportedFields);

    const out: Record<string, unknown> = {};
    const name = readStringField(event, ["name"]);
    if (name !== undefined) {
      out.name = name;
    }
    const timestamp = parseUnixNanoToIso(event.timeUnixNano);
    if (timestamp !== undefined) {
      out.timestamp = timestamp;
    } else if (event.timeUnixNano !== undefined) {
      unsupportedFields.push(`${eventPath}.timeUnixNano`);
      warnings.push({
        code: "otlp_event_timestamp_invalid",
        message: "OTLP event timeUnixNano could not be parsed.",
        severity: "warning",
        field: `${eventPath}.timeUnixNano`,
      });
    }
    if (Object.keys(sanitized.attributes).length > 0) {
      out.attributes = sanitized.attributes;
    }
    events.push(out);
  }

  return {
    events: events.length > 0 ? events : undefined,
    warnings,
    unsupportedFields,
  };
}

function mapOtlpSpan(context: OtlpSpanContext): OpenInferenceMappedSpan {
  const { span, pathPrefix } = context;
  const warnings: TraceReadWarning[] = [];
  const unsupportedFields: string[] = [];
  const parsedSpanAttributes = parseOtlpAttributes(
    span.attributes,
    `${pathPrefix}.attributes`,
  );
  warnings.push(...parsedSpanAttributes.warnings);
  unsupportedFields.push(...parsedSpanAttributes.unsupportedFields);

  const sanitizedSpanAttributes = sanitizeOtlpAttributes(
    parsedSpanAttributes.attributes,
    `${pathPrefix}.attributes`,
  );
  warnings.push(...sanitizedSpanAttributes.warnings);
  unsupportedFields.push(...sanitizedSpanAttributes.unsupportedFields);

  const attributes: Record<string, unknown> = {
    ...sanitizedSpanAttributes.attributes,
  };
  for (const [key, value] of Object.entries(context.resourceAttributes)) {
    attributes[`resource.${key}`] = value;
  }
  for (const [key, value] of Object.entries(context.scopeAttributes)) {
    attributes[`scope.${key}`] = value;
  }
  if (context.scopeName !== undefined) {
    attributes["scope.name"] = context.scopeName;
  }
  if (context.scopeVersion !== undefined) {
    attributes["scope.version"] = context.scopeVersion;
  }

  for (const [key, value] of Object.entries(span)) {
    if (OTLP_SPAN_KEYS.has(key)) continue;
    unsupportedFields.push(`${pathPrefix}.${key}`);
    if (value === null || typeof value !== "object") {
      attributes[`otlp.${key}`] = value;
    } else {
      attributes[`otlp.${key}.summary`] = summarizeAttributeValue(value);
      warnings.push({
        code: "otlp_unsupported_field_summarized",
        message: `Unsupported OTLP span field "${key}" was summarized.`,
        severity: "warning",
        field: `${pathPrefix}.${key}`,
      });
    }
  }

  for (const key of [
    "droppedAttributesCount",
    "droppedEventsCount",
    "droppedLinksCount",
    "links",
  ]) {
    if (span[key] !== undefined) {
      unsupportedFields.push(`${pathPrefix}.${key}`);
      warnings.push({
        code: "otlp_span_field_not_mapped",
        message: `OTLP span field "${key}" is not represented in AgentInspect events.`,
        severity: "warning",
        field: `${pathPrefix}.${key}`,
      });
    }
  }

  const events = mapOtlpEvents(span.events, `${pathPrefix}.events`);
  warnings.push(...events.warnings);
  unsupportedFields.push(...events.unsupportedFields);
  if (events.events !== undefined) {
    attributes["otlp.events"] = events.events;
  }

  const traceId = readStringField(span, ["traceId"]) ?? "trace-unknown";
  const spanId = readStringField(span, ["spanId"]) ?? "span-unknown";
  const parentSpanId = readStringField(span, ["parentSpanId"]);
  const startedAt = readOpenInferenceTimestamp(
    span,
    ["startTimeUnixNano"],
    [],
  );
  const endedAt = readOpenInferenceTimestamp(span, ["endTimeUnixNano"], []);
  const timestamp = startedAt ?? "1970-01-01T00:00:00.000Z";
  if (startedAt === undefined) {
    unsupportedFields.push(`${pathPrefix}.startTimeUnixNano`);
    warnings.push({
      code: "otlp_missing_start_time",
      message: "OTLP span is missing a valid startTimeUnixNano; using Unix epoch.",
      severity: "warning",
      field: `${pathPrefix}.startTimeUnixNano`,
    });
  }

  const { kind, warnings: kindWarnings } = readOtlpKind(
    parsedSpanAttributes.attributes,
    pathPrefix,
  );
  warnings.push(...kindWarnings);
  const status = mapOtlpStatus(span.status);
  const tokenUsage = readOtlpTokenUsage(parsedSpanAttributes.attributes);
  const errorMessage =
    isRecord(span.status) && typeof span.status.message === "string"
      ? span.status.message
      : undefined;

  const event: PersistedInspectEvent = {
    schemaVersion: "0.2",
    eventId:
      typeof parsedSpanAttributes.attributes["agent_inspect.event_id"] === "string"
        ? parsedSpanAttributes.attributes["agent_inspect.event_id"]
        : spanId,
    runId:
      typeof parsedSpanAttributes.attributes["agent_inspect.run_id"] === "string"
        ? parsedSpanAttributes.attributes["agent_inspect.run_id"]
        : traceId,
    kind,
    name: readStringField(span, ["name"]) ?? spanId,
    timestamp,
    confidence: readOtlpConfidence(parsedSpanAttributes.attributes),
    source: {
      type: "otel",
      name:
        context.scopeName ??
        (typeof context.resourceAttributes["service.name"] === "string"
          ? context.resourceAttributes["service.name"]
          : "otlp-json"),
      ...(context.scopeVersion !== undefined
        ? { version: context.scopeVersion }
        : {}),
    },
    attributes,
    trace: {
      traceId,
      spanId,
      ...(parentSpanId !== undefined ? { parentSpanId } : {}),
    },
  };

  if (status !== undefined) {
    event.status = status;
  }
  if (startedAt !== undefined) {
    event.startedAt = startedAt;
  }
  if (endedAt !== undefined) {
    event.endedAt = endedAt;
  }
  const durationMs = durationBetweenIso(startedAt, endedAt);
  if (durationMs !== undefined) {
    event.durationMs = durationMs;
  }
  if (tokenUsage !== undefined) {
    event.tokenUsage = tokenUsage;
  }
  if (status === "error") {
    event.error = {
      message: errorMessage !== undefined && errorMessage.trim() !== "" ? errorMessage : "OTLP span error",
    };
  }

  return {
    event,
    warnings,
    unsupportedFields,
    spanId,
    ...(parentSpanId !== undefined ? { parentSpanId } : {}),
  };
}

function mapOtlpEventsToPersisted(document: OtlpDocument): {
  events: PersistedInspectEvent[];
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
} {
  const mapped = document.spans.map((span) => mapOtlpSpan(span));
  const spanIdToEventId = new Map(
    mapped.map((span) => [span.spanId, span.event.eventId] as const),
  );
  for (const span of mapped) {
    if (span.parentSpanId === undefined) continue;
    span.event.parentId = spanIdToEventId.get(span.parentSpanId) ?? span.parentSpanId;
  }
  return {
    events: mapped.map((span) => span.event),
    warnings: mapped.flatMap((span) => span.warnings),
    unsupportedFields: mapped.flatMap((span) => span.unsupportedFields),
  };
}

export const otlpJsonReader: TraceReader = {
  format: OTLP_READER_FORMAT,
  name: "OTLP JSON",
  async detect(input) {
    const resolved = await resolveInput(input);
    if (!resolved) return undefined;

    let parsed: unknown;
    try {
      parsed = parseJsonDocument(resolved.content);
    } catch {
      return undefined;
    }

    const document = extractOtlpDocument(parsed);
    if (!document) return undefined;

    return {
      format: OTLP_READER_FORMAT,
      confidence: document.confidence,
      readerName: "OTLP JSON",
      description: document.description,
      warnings: attachSingleSourceFile(document.warnings, resolved),
    };
  },
  async read(input) {
    const resolved = await resolveInput(input);
    if (!resolved) {
      throw new TraceReadError(
        "unsupported_format",
        "OTLP JSON reader requires file, string, or buffer input.",
      );
    }

    let parsed: unknown;
    try {
      parsed = parseJsonDocument(resolved.content);
    } catch {
      throw new TraceReadError("unsupported_format", "OTLP JSON input is not valid JSON.", [
        {
          code: "otlp_invalid_json",
          message: "OTLP JSON reader could not parse the input as JSON.",
          severity: "error",
        },
      ]);
    }

    const document = extractOtlpDocument(parsed);
    if (!document || document.spans.length === 0) {
      throw new TraceReadError(
        "unsupported_format",
        "No valid OTLP spans found.",
        attachSingleSourceFile(
          document?.warnings ?? [
            {
              code: "otlp_no_valid_spans",
              message: "OTLP JSON input did not contain valid spans.",
              severity: "error",
            },
          ],
          resolved,
        ),
      );
    }

    const mapped = mapOtlpEventsToPersisted(document);
    const warnings = attachSingleSourceFile(
      [...document.warnings, ...mapped.warnings],
      resolved,
    );
    const unsupportedFields = [
      ...document.unsupportedFields,
      ...mapped.unsupportedFields,
    ].sort((a, b) => a.localeCompare(b));

    return {
      format: OTLP_READER_FORMAT,
      events: mapped.events,
      runs: persistedInspectEventsToRunTrees(mapped.events, { skipInvalid: true }),
      warnings,
      unsupportedFields,
      sourceFiles: resolved.sourceFiles,
    };
  },
};

export const agentInspectJsonlReader: TraceReader = {
  format: "agent-inspect-jsonl",
  name: "AgentInspect JSONL",
  async detect(input) {
    const resolved = await resolveInput(input);
    if (!resolved) return undefined;
    const detected = detectJsonlFormat(resolved.content);
    if (detected.validRows === 0 || detected.format === "empty") {
      return undefined;
    }

    return {
      format: "agent-inspect-jsonl",
      confidence: 0.95,
      readerName: "AgentInspect JSONL",
      description: agentInspectFormatLabel(detected.format),
      warnings: attachSingleSourceFile(detected.warnings, resolved),
    };
  },
  async read(input) {
    const resolved = await resolveInput(input);
    if (!resolved) {
      throw new Error("AgentInspect JSONL reader requires file, directory, string, or buffer input.");
    }

    const parsed = parseTraceJsonl(resolved.content, { warnings: false });
    if (parsed.sourceEventCount === 0) {
      throw new Error("No valid AgentInspect JSONL events found.");
    }

    const events = persistedEventsForParsedTrace(parsed);
    return {
      format: agentInspectFormatLabel(parsed.format),
      events,
      runs: persistedInspectEventsToRunTrees(events, { skipInvalid: true }),
      warnings:
        parsed.format === "mixed"
          ? attachSingleSourceFile(
              [
                {
                  code: "mixed_agent_inspect_jsonl",
                  message:
                    "Trace input mixes schemaVersion 0.1 and 0.2 rows; events were normalized for reading.",
                  severity: "warning",
                },
              ],
              resolved,
            )
          : [],
      unsupportedFields: [],
      sourceFiles: resolved.sourceFiles,
    };
  },
};

export const DEFAULT_TRACE_READERS: readonly TraceReader[] = [
  agentInspectJsonlReader,
  openInferenceJsonReader,
  otlpJsonReader,
];

export async function detectTraceFormat(
  input: TraceInput,
  options: TraceReadOptions = {},
): Promise<TraceFormatDetectionResult> {
  const readers = options.readers ?? DEFAULT_TRACE_READERS;

  if (options.format !== undefined) {
    const reader = findReaderByFormat(options.format, readers);
    if (!reader) {
      return {
        status: "unsupported",
        candidates: [],
        warnings: [
          {
            code: "unsupported_format",
            message: `No trace reader is registered for format "${options.format}".`,
            severity: "error",
          },
        ],
      };
    }

    return {
      status: "detected",
      format: reader.format,
      candidates: [
        {
          format: reader.format,
          confidence: 1,
          readerName: reader.name,
          description: "Explicit format override",
        },
      ],
      warnings: [],
    };
  }

  const candidates: TraceFormatCandidate[] = [];
  const warnings: TraceReadWarning[] = [];

  for (const reader of readers) {
    try {
      const candidate = await reader.detect(input);
      if (candidate !== undefined) {
        candidates.push(normalizeCandidate(reader, candidate));
      }
    } catch (error) {
      if (error instanceof TraceReadError) {
        warnings.push(...error.warnings);
        continue;
      }
      warnings.push({
        code: "reader_detect_failed",
        message:
          error instanceof Error && error.message.trim() !== ""
            ? error.message
            : `Trace reader "${reader.format}" failed during detection.`,
        severity: "warning",
      });
    }
  }

  const sorted = sortCandidates(
    candidates.filter((candidate) => candidate.confidence >= MIN_DETECTION_CONFIDENCE),
  );
  const candidateWarnings = collectWarnings(sorted);
  const lowConfidenceWarnings: TraceReadWarning[] =
    candidates.length > sorted.length
      ? [
          {
            code: "low_confidence_candidates",
            message: `Ignored ${candidates.length - sorted.length} low-confidence format candidate(s).`,
            severity: "info",
          },
        ]
      : [];
  const allWarnings = dedupeWarnings([
    ...warnings,
    ...candidateWarnings,
    ...lowConfidenceWarnings,
  ]);

  if (sorted.length === 0) {
    return {
      status: "unsupported",
      candidates: [],
      warnings: allWarnings,
    };
  }

  const [best, second] = sorted;
  if (
    second !== undefined &&
    best.confidence - second.confidence <= AMBIGUOUS_CONFIDENCE_DELTA
  ) {
    return {
      status: "ambiguous",
      candidates: sorted,
      warnings: [
        ...allWarnings,
        {
          code: "ambiguous_format_candidates",
          message: `Top trace format candidates are within ${AMBIGUOUS_CONFIDENCE_DELTA} confidence.`,
          severity: "warning",
        },
      ],
    };
  }

  return {
    status: "detected",
    format: best.format,
    candidates: sorted,
    warnings: allWarnings,
  };
}

export async function readTrace(
  input: TraceInput,
  options: TraceReadOptions = {},
): Promise<TraceReadResult> {
  const readers = options.readers ?? DEFAULT_TRACE_READERS;
  const detection = await detectTraceFormat(input, options);

  if (detection.status === "unsupported" || detection.format === undefined) {
    throw new TraceReadError(
      "unsupported_format",
      "No trace reader could detect the input format.",
      detection.warnings,
    );
  }
  if (detection.status === "ambiguous") {
    throw new TraceReadError(
      "ambiguous_format",
      "Multiple trace readers matched the input with equal confidence.",
      detection.warnings,
    );
  }

  const reader = findReaderByFormat(detection.format, readers);
  if (!reader) {
    throw new TraceReadError(
      "unsupported_format",
      `No trace reader is registered for format "${detection.format}".`,
      detection.warnings,
    );
  }

  try {
    const result = await reader.read(input, { format: detection.format });
    return {
      ...result,
      format: result.format || detection.format,
      warnings: [...detection.warnings, ...result.warnings],
    };
  } catch (error) {
    if (error instanceof TraceReadError) {
      throw new TraceReadError(
        error.code,
        error.message,
        dedupeWarnings([...detection.warnings, ...error.warnings]),
      );
    }
    throw new TraceReadError(
      "reader_failed",
      error instanceof Error && error.message.trim() !== ""
        ? error.message
        : `Trace reader "${reader.format}" failed.`,
      detection.warnings,
    );
  }
}

export function openTrace(
  input: TraceInput,
  options: TraceReadOptions = {},
): Promise<TraceReadResult> {
  return readTrace(input, options);
}
