import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  OTEL_GEN_AI_SEMCONV_PIN,
  validateOpenInferenceFixture,
  validateOtlpJsonFixture,
} from "../../src/exporters/index.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("standards fixtures", () => {
  it("validates openinference committed fixture", () => {
    const content = readFileSync(
      path.join(root, "fixtures/openinference-basic.json"),
      "utf8",
    );
    const result = validateOpenInferenceFixture(content);
    expect(result.ok).toBe(true);
  });

  it("validates otlp-json committed fixture", () => {
    const content = readFileSync(path.join(root, "fixtures/otlp-basic.json"), "utf8");
    const result = validateOtlpJsonFixture(content);
    expect(result.ok).toBe(true);
  });

  it("pins otel gen_ai semconv reference", () => {
    expect(OTEL_GEN_AI_SEMCONV_PIN.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(OTEL_GEN_AI_SEMCONV_PIN.attributes.length).toBeGreaterThan(0);
  });
});
