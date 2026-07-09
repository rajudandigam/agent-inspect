import type { ExportValidationResult } from "./types.js";
import { validateExportContent } from "./validation.js";

/** Validate committed or exported OpenInference-compatible JSON fixtures. */
export function validateOpenInferenceFixture(content: string): ExportValidationResult {
  return validateExportContent("openinference", content);
}

/** Validate committed or exported OTLP JSON fixtures. */
export function validateOtlpJsonFixture(content: string): ExportValidationResult {
  return validateExportContent("otlp-json", content);
}
