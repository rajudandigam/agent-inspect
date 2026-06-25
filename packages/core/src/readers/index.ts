import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { parseTraceJsonl, type TraceJsonlFormat } from "../read-trace.js";
import {
  traceEventToPersistedInspectEvent,
  traceEventsToPersistedInspectEvents,
} from "../persisted/from-trace-event.js";
import { persistedInspectEventsToRunTrees } from "../persisted/tree-bridge.js";
import type { InspectRunTree } from "../types/inspect-event.js";
import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";

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

const DEFAULT_MAX_TRACE_INPUT_BYTES = 10 * 1024 * 1024;
const MIN_DETECTION_CONFIDENCE = 0.5;
const AMBIGUOUS_CONFIDENCE_DELTA = 0.05;
const resolvedInputCache = new WeakMap<TraceInput, Promise<ResolvedTraceInput | undefined>>();

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
  if (saw01 && saw02) format = "mixed";
  else if (saw01) format = "0.1";
  else if (saw02) format = "0.2";

  return { format, validRows, warnings };
}

function agentInspectFormatLabel(format: TraceJsonlFormat): string {
  switch (format) {
    case "0.1":
      return "agent-inspect-v0.1-jsonl";
    case "0.2":
      return "agent-inspect-v0.2-jsonl";
    case "mixed":
      return "agent-inspect-mixed-jsonl";
    default:
      return "agent-inspect-jsonl";
  }
}

function persistedEventsForParsedTrace(
  parsed: ReturnType<typeof parseTraceJsonl>,
): PersistedInspectEvent[] {
  if (parsed.format === "0.2" && parsed.persisted.length > 0) {
    return [...parsed.persisted];
  }
  if (parsed.format === "mixed" && parsed.rows.length > 0) {
    return parsed.rows.map((row, index) => {
      if (row.format === "0.2") return row.event;
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
  const allWarnings = [...warnings, ...candidateWarnings, ...lowConfidenceWarnings];

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
        [...detection.warnings, ...error.warnings],
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
