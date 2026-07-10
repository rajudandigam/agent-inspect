import type { InspectRunTree } from "../types/inspect-event.js";

import type { ExportOptions, ExportResult, ExportValidationResult } from "./types.js";
import { redactRunTreeForExport } from "./redact-export.js";
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
    redactionProfile: options.redactionProfile ?? "local",
  };
}

/**
 * @experimental Compatibility-oriented export API. Exports are local-only and do not upload anywhere.
 * Subject to refinement before a future stability declaration.
 */
export function exportRunTree(tree: InspectRunTree, options: ExportOptions): ExportResult {
  const opts = mergeExportDefaults(options);
  const exportTree =
    opts.redactionProfile === "local"
      ? tree
      : redactRunTreeForExport(tree, { redactionProfile: opts.redactionProfile });
  switch (opts.format) {
    case "markdown":
      return exportMarkdown(exportTree, opts);
    case "html":
      return exportHtml(exportTree, opts);
    case "openinference":
      return exportOpenInference(exportTree, opts);
    case "otlp-json":
      return exportOtlpJson(exportTree, opts);
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
export {
  validateOpenInferenceFixture,
  validateOtlpJsonFixture,
} from "./fixtures.js";
export {
  validateOpenInferenceSemanticFixture,
  validateOtlpJsonSemanticFixture,
} from "./semantic-validation.js";
export { OTEL_GEN_AI_SEMCONV_PIN } from "./semconv.js";
export { redactRunTreeForExport } from "./redact-export.js";
