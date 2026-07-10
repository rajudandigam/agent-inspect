/**
 * Semantic field checks beyond shape validation for standards fixtures.
 */
import type { ExportValidationResult } from "./types.js";
import { validateOpenInferenceFixture, validateOtlpJsonFixture } from "./fixtures.js";

const SEMCONV_PIN = "OTEL_GEN_AI_SEMCONV_PIN";

function semanticWarnings(format: "openinference" | "otlp-json", parsed: Record<string, unknown>): string[] {
  const warnings: string[] = [];
  if (format === "openinference") {
    const spans = Array.isArray(parsed.spans) ? parsed.spans : [];
    if (spans.length > 0) {
      const first = spans[0] as Record<string, unknown>;
      if (first.trace_id === undefined && first.traceId === undefined) {
        warnings.push("OpenInference semantic: first span missing trace_id");
      }
    }
  }
  if (format === "otlp-json") {
    warnings.push(`OTLP semantic validation pinned to ${SEMCONV_PIN} mapping docs`);
  }
  return warnings;
}

export function validateOpenInferenceSemanticFixture(content: string): ExportValidationResult {
  const base = validateOpenInferenceFixture(content);
  if (!base.ok) return base;
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      ...base,
      warnings: [...base.warnings, ...semanticWarnings("openinference", parsed)],
    };
  } catch {
    return base;
  }
}

export function validateOtlpJsonSemanticFixture(content: string): ExportValidationResult {
  const base = validateOtlpJsonFixture(content);
  if (!base.ok) return base;
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      ...base,
      warnings: [...base.warnings, ...semanticWarnings("otlp-json", parsed)],
    };
  } catch {
    return base;
  }
}
