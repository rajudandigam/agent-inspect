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

function findReaderByFormat(
  format: string,
  readers: readonly TraceReader[],
): TraceReader | undefined {
  return readers.find((reader) => reader.format === format);
}

export async function detectTraceFormat(
  input: TraceInput,
  options: TraceReadOptions = {},
): Promise<TraceFormatDetectionResult> {
  const readers = options.readers ?? [];

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

  const sorted = sortCandidates(candidates);
  const candidateWarnings = collectWarnings(sorted);
  const allWarnings = [...warnings, ...candidateWarnings];

  if (sorted.length === 0) {
    return {
      status: "unsupported",
      candidates: [],
      warnings: allWarnings,
    };
  }

  const [best, second] = sorted;
  if (second !== undefined && second.confidence === best.confidence) {
    return {
      status: "ambiguous",
      candidates: sorted,
      warnings: allWarnings,
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
  const readers = options.readers ?? [];
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
