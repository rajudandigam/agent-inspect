import { describe, expect, it } from "vitest";

import type { ExportFormat, ExportResult, ExportValidationResult } from "../../src/exporters/types.js";

describe("exporter types", () => {
  it("supports format literals", () => {
    const formats: ExportFormat[] = ["markdown", "html", "openinference", "otlp-json"];
    expect(formats).toHaveLength(4);
  });

  it("ExportResult shape", () => {
    const r: ExportResult = {
      format: "markdown",
      content: "# x",
      contentType: "text/markdown",
      fileExtension: ".md",
      warnings: [],
    };
    expect(r.fileExtension).toBe(".md");
  });

  it("ExportValidationResult shape", () => {
    const v: ExportValidationResult = {
      ok: true,
      format: "markdown",
      errors: [],
      warnings: [],
    };
    expect(v.ok).toBe(true);
  });
});
