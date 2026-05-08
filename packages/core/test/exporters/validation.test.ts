import { describe, expect, it } from "vitest";

import { validateExportContent } from "../../src/exporters/validation.js";

describe("validateExportContent", () => {
  it("validates markdown", () => {
    const r = validateExportContent("markdown", "# AgentInspect Run: x\n");
    expect(r.ok).toBe(true);
  });

  it("rejects bad markdown prefix", () => {
    const r = validateExportContent("markdown", "## nope");
    expect(r.ok).toBe(false);
  });

  it("validates html", () => {
    const r = validateExportContent(
      "html",
      "<!doctype html><html><head></head><body>x</body></html>",
    );
    expect(r.ok).toBe(true);
  });

  it("rejects script in html", () => {
    const r = validateExportContent("html", "<!doctype html><script>x</script>");
    expect(r.ok).toBe(false);
  });

  it("validates openinference JSON", () => {
    const j = JSON.stringify({
      format: "openinference",
      spans: [],
    });
    const r = validateExportContent("openinference", j);
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => /experimental/i.test(w))).toBe(true);
  });

  it("invalid JSON fails openinference", () => {
    const r = validateExportContent("openinference", "{");
    expect(r.ok).toBe(false);
  });

  it("validates otlp-json", () => {
    const j = JSON.stringify({ resourceSpans: [] });
    const r = validateExportContent("otlp-json", j);
    expect(r.ok).toBe(true);
  });
});
