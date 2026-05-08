import type { InspectRunTree } from "../types/inspect-event.js";

import type { ExportOptions, ExportResult, ExportValidationResult } from "./types.js";
import { exportHtml } from "./html-exporter.js";
import { exportMarkdown } from "./markdown-exporter.js";
import { exportOpenInference } from "./openinference-exporter.js";
import { exportOtlpJson } from "./otlp-json-exporter.js";
import { validateExportContent } from "./validation.js";

export function mergeExportDefaults(options: ExportOptions): ExportOptions {
  return {
    format: options.format,
    includeMetadata: options.includeMetadata ?? true,
    includeAttributes: options.includeAttributes ?? false,
    includeErrors: options.includeErrors ?? true,
    pretty: options.pretty ?? true,
    redacted: options.redacted ?? true,
    maxAttributeLength: options.maxAttributeLength ?? 500,
  };
}

export function exportRunTree(tree: InspectRunTree, options: ExportOptions): ExportResult {
  const opts = mergeExportDefaults(options);
  switch (opts.format) {
    case "markdown":
      return exportMarkdown(tree, opts);
    case "html":
      return exportHtml(tree, opts);
    case "openinference":
      return exportOpenInference(tree, opts);
    case "otlp-json":
      return exportOtlpJson(tree, opts);
    default: {
      const _x: never = opts.format;
      throw new Error(`Unsupported export format: ${String(_x)}`);
    }
  }
}

export function validateExport(result: ExportResult): ExportValidationResult {
  const base = validateExportContent(result.format, result.content);
  return {
    ok: base.ok,
    format: base.format,
    errors: base.errors,
    warnings: [...result.warnings, ...base.warnings],
  };
}

export type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  ExportValidationResult,
  TraceExporter,
} from "./types.js";
export { EXPORT_PAYLOAD_VERSION } from "./types.js";
export * from "./helpers.js";
export { manualTraceEventsToRunTree } from "./manual-trace-adapter.js";
export { exportMarkdown } from "./markdown-exporter.js";
export { exportHtml } from "./html-exporter.js";
export type { OpenInferenceExport, OpenInferenceSpan } from "./openinference-exporter.js";
export { exportOpenInference } from "./openinference-exporter.js";
export { exportOtlpJson } from "./otlp-json-exporter.js";
export { validateExportContent } from "./validation.js";
