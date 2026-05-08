/**
 * v0.7 local export formats. No sinks — string output only.
 */

import type { InspectRunTree } from "../types/inspect-event.js";

export type ExportFormat = "markdown" | "html" | "openinference" | "otlp-json";

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeAttributes?: boolean;
  includeErrors?: boolean;
  pretty?: boolean;
  redacted?: boolean;
  maxAttributeLength?: number;
}

export interface ExportResult {
  format: ExportFormat;
  content: string;
  contentType: string;
  fileExtension: string;
  warnings: string[];
}

export interface ExportValidationResult {
  ok: boolean;
  format: ExportFormat;
  errors: string[];
  warnings: string[];
}

export interface TraceExporter {
  name: string;
  format: ExportFormat;
  export(tree: InspectRunTree, options?: Partial<ExportOptions>): ExportResult;
  validate?(content: string): ExportValidationResult;
}

/** Library version string embedded in JSON exports (human-readable, not semver guarantee for formats). */
export const EXPORT_PAYLOAD_VERSION = "0.1.2";
