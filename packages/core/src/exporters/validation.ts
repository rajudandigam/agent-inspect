import type { ExportFormat, ExportValidationResult } from "./types.js";

const EXPERIMENTAL =
  "Experimental compatibility export — verify against your target tooling before relying on it.";

export function validateExportContent(
  format: ExportFormat,
  content: string,
): ExportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [EXPERIMENTAL];

  if (format === "markdown") {
    if (!content.startsWith("# AgentInspect Run")) {
      errors.push('Markdown export must start with "# AgentInspect Run"');
    }
    return { ok: errors.length === 0, format, errors, warnings };
  }

  if (format === "html") {
    const lower = content.toLowerCase();
    if (!lower.includes("<!doctype html")) {
      errors.push("HTML export must include <!doctype html>");
    }
    if (/<\s*script\b/i.test(content)) {
      errors.push("HTML export must not contain script tags");
    }
    if (/<\s*link\b[^>]*href\s*=/i.test(content)) {
      warnings.push("HTML export contains link tags — ensure no external stylesheets.");
    }
    return { ok: errors.length === 0, format, errors, warnings };
  }

  if (format === "openinference") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      errors.push("OpenInference export is not valid JSON");
      return { ok: false, format, errors, warnings };
    }
    if (!parsed || typeof parsed !== "object") {
      errors.push("OpenInference export JSON must be an object");
      return { ok: false, format, errors, warnings };
    }
    const o = parsed as Record<string, unknown>;
    if (o.format !== "openinference") {
      errors.push('OpenInference export must include format: "openinference"');
    }
    if (!Array.isArray(o.spans)) {
      errors.push("OpenInference export must include a spans array");
    }
    warnings.push("OpenInference-compatible JSON is not guaranteed for every backend.");
    return { ok: errors.length === 0, format, errors, warnings };
  }

  if (format === "otlp-json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      errors.push("OTLP JSON export is not valid JSON");
      return { ok: false, format, errors, warnings };
    }
    if (!parsed || typeof parsed !== "object") {
      errors.push("OTLP JSON export must be an object");
      return { ok: false, format, errors, warnings };
    }
    const o = parsed as Record<string, unknown>;
    if (!Array.isArray(o.resourceSpans)) {
      errors.push("OTLP JSON export must include resourceSpans array");
    }
    warnings.push(
      "OTLP JSON mapping uses OTel GenAI-aligned attributes where applicable; collectors may require transformation.",
    );
    return { ok: errors.length === 0, format, errors, warnings };
  }

  errors.push(`Unsupported export format`);
  return { ok: false, format, errors, warnings };
}
