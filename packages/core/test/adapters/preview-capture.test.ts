import { describe, expect, it, vi } from "vitest";

import {
  ADAPTER_CAPTURE_DIAGNOSTIC_CODES,
  DEFAULT_ADAPTER_MAX_PREVIEW_CHARS,
  createAdapterPreviewCapture,
  resolveAdapterMaxPreviewChars,
  serializeAdapterPreview,
  type AdapterCaptureDiagnostic,
} from "../../src/adapters/preview-capture.js";

describe("shared adapter preview capture (#311)", () => {
  it("captures nothing in the default metadata-only mode", () => {
    const capture = createAdapterPreviewCapture();

    expect(capture.capture).toBe("metadata-only");
    expect(capture.previewEnabled).toBe(false);
    expect(capture.capturePreviewField("input", "raw prompt")).toBeUndefined();
    expect(
      capture.applyPreviewFields({}, { input: "raw prompt" }),
    ).toEqual({});
    expect(capture.getDiagnostics()).toMatchObject({
      capture: "metadata-only",
      maxPreviewChars: DEFAULT_ADAPTER_MAX_PREVIEW_CHARS,
      previewFieldsCaptured: 0,
      previewFieldsUnavailable: 0,
    });
  });

  it("bounds preview fields by maxPreviewChars and reports truncation", () => {
    const diagnostics: AdapterCaptureDiagnostic[] = [];
    const capture = createAdapterPreviewCapture({
      capture: "preview",
      maxPreviewChars: 12,
      onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    });

    const preview = capture.capturePreviewField("input", "y".repeat(400));

    expect(preview).toHaveLength(13);
    expect(preview?.endsWith("…")).toBe(true);
    expect(diagnostics.map((entry) => entry.code)).toEqual([
      "AI_CAPTURE_PREVIEW_TRUNCATED",
    ]);
    expect(diagnostics[0]?.field).toBe("inputPreview");
    expect(capture.getDiagnostics()).toMatchObject({
      previewFieldsCaptured: 1,
      previewFieldsTruncated: 1,
    });
  });

  it("emits AI_CAPTURE_FIELD_UNAVAILABLE when a requested field has no source", () => {
    const diagnostics: AdapterCaptureDiagnostic[] = [];
    const capture = createAdapterPreviewCapture({
      capture: "preview",
      onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    });

    expect(capture.capturePreviewField("output", undefined)).toBeUndefined();
    expect(diagnostics).toEqual([
      {
        code: "AI_CAPTURE_FIELD_UNAVAILABLE",
        field: "outputPreview",
        capture: "preview",
        message: expect.stringContaining("outputPreview"),
      },
    ]);
    expect(capture.getDiagnostics()).toMatchObject({
      previewFieldsUnavailable: 1,
      lastDiagnosticCode: "AI_CAPTURE_FIELD_UNAVAILABLE",
    });
  });

  it("redacts sensitive keys before the preview string exists", () => {
    const capture = createAdapterPreviewCapture({
      capture: "preview",
      maxPreviewChars: 400,
    });

    const preview = capture.capturePreviewField("input", {
      question: "refund policy",
      apiKey: "sk-live-should-not-persist",
    });

    expect(preview).toContain("refund policy");
    expect(preview).toContain("[REDACTED]");
    expect(preview).not.toContain("sk-live-should-not-persist");
    expect(capture.getDiagnostics()).toMatchObject({
      previewFieldsRedacted: 1,
      lastDiagnosticCode: "AI_CAPTURE_PREVIEW_REDACTED",
    });
  });

  it("honors adapter redaction rules in addition to profile keys", () => {
    const capture = createAdapterPreviewCapture({
      capture: "preview",
      maxPreviewChars: 400,
      redact: [{ key: "accountRef", strategy: "full" }],
    });

    const preview = capture.capturePreviewField("input", {
      accountRef: "acct-42",
    });

    expect(preview).not.toContain("acct-42");
    expect(preview).toContain("[REDACTED]");
  });

  it("caps maxPreviewChars using share and strict profile limits", () => {
    expect(resolveAdapterMaxPreviewChars(5000, "local")).toBe(5000);
    expect(resolveAdapterMaxPreviewChars(5000, "share")).toBe(200);
    expect(resolveAdapterMaxPreviewChars(5000, "strict")).toBe(80);
    expect(resolveAdapterMaxPreviewChars(40, "strict")).toBe(40);
    expect(resolveAdapterMaxPreviewChars(undefined)).toBe(
      DEFAULT_ADAPTER_MAX_PREVIEW_CHARS,
    );
    expect(resolveAdapterMaxPreviewChars(-3)).toBe(
      DEFAULT_ADAPTER_MAX_PREVIEW_CHARS,
    );
  });

  it("replaces whole preview fields under the strict profile", () => {
    const capture = createAdapterPreviewCapture({
      capture: "preview",
      redactionProfile: "strict",
    });

    expect(capture.capturePreviewField("input", "customer transcript")).toBe(
      '"[REDACTED]"',
    );
    expect(capture.maxPreviewChars).toBe(80);
  });

  it("keeps already-suffixed preview names stable", () => {
    const capture = createAdapterPreviewCapture({ capture: "preview" });

    expect(capture.previewFieldName("streamPreview")).toBe("streamPreview");
    expect(capture.previewFieldName("input")).toBe("inputPreview");
    expect(
      capture.applyPreviewFields({}, { streamPreview: "abc", output: "def" }),
    ).toEqual({ streamPreview: '"abc"', outputPreview: '"def"' });
  });

  it("survives cycles, bigints, and throwing getters without throwing", () => {
    const capture = createAdapterPreviewCapture({
      capture: "preview",
      maxPreviewChars: 400,
    });

    const cyclic: Record<string, unknown> = { name: "root" };
    cyclic.self = cyclic;
    expect(capture.capturePreviewField("input", cyclic)).toContain("[Circular]");
    expect(capture.capturePreviewField("input", { total: 7n })).toContain("7");

    const hostile = {
      get boom(): string {
        throw new Error("hostile getter");
      },
    };
    expect(() => capture.capturePreviewField("input", hostile)).not.toThrow();
    expect(capture.capturePreviewField("input", hostile)).not.toContain("boom");

    // A value JSON cannot represent at all is reported as unavailable.
    expect(
      capture.capturePreviewField("output", () => "opaque"),
    ).toBeUndefined();
    expect(capture.getDiagnostics()).toMatchObject({
      previewFieldsUnavailable: 1,
      lastDiagnosticCode: "AI_CAPTURE_FIELD_UNAVAILABLE",
    });
  });

  it("isolates consumer diagnostic listener failures", () => {
    const onDiagnostic = vi.fn(() => {
      throw new Error("listener exploded");
    });
    const capture = createAdapterPreviewCapture({
      capture: "preview",
      onDiagnostic,
    });

    expect(() => capture.capturePreviewField("input", undefined)).not.toThrow();
    expect(onDiagnostic).toHaveBeenCalledTimes(1);
  });

  it("exposes stable diagnostic codes and bounded serialization", () => {
    expect([...ADAPTER_CAPTURE_DIAGNOSTIC_CODES]).toEqual([
      "AI_CAPTURE_FIELD_UNAVAILABLE",
      "AI_CAPTURE_PREVIEW_TRUNCATED",
      "AI_CAPTURE_PREVIEW_REDACTED",
    ]);
    expect(serializeAdapterPreview("hello", 0)).toBeUndefined();
    expect(serializeAdapterPreview("hello", -1)).toBeUndefined();
    expect(serializeAdapterPreview(undefined, 20)).toBeUndefined();
    expect(serializeAdapterPreview({ a: 1 }, 20)).toBe('{"a":1}');
    expect(serializeAdapterPreview("abcdef", 3)).toBe('"ab…');
  });
});
