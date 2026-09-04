import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  KEY_VALUE_SECRET_PATTERN_SOURCE,
  redact,
  valueContainsKeyValueSecret,
} from "../src/index.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

describe("value.keyValueSecret (#327)", () => {
  it.each([
    "internal_token=synthetic-house-secret-123456",
    "token=synthetic-house-secret-123456",
    "api_key=synthetic-house-secret-123456",
    "api-key=synthetic-house-secret-123456",
    "access_token=synthetic-house-secret-123456",
    "auth_token=synthetic-house-secret-123456",
    "password=synthetic-house-secret-123456",
    "secret=synthetic-house-secret-123456",
    "note internal_token=synthetic-house-secret-123456 trailing",
  ])("redacts %s", (value) => {
    const result = redact({ value }, { profile: "share" });
    expect(result.value).toEqual({ value: "[REDACTED]" });
    expect(result.findings.some((f) => f.detector === "value.keyValueSecret")).toBe(
      true,
    );
    expect(JSON.stringify(result)).not.toContain("synthetic-house-secret-123456");
    expect(JSON.stringify(result.findings)).not.toContain(
      "synthetic-house-secret-123456",
    );
  });

  it.each([
    "maxTokens=4096",
    "tokenCount=128",
    "secret=false",
    "token=short",
    "token=abcdefg",
    "password=short1",
    "ordinary prose about a token and a secret",
    "agent-inspect@6.17.6",
    "duration=500ms",
  ])("does not redact lookalike %s", (value) => {
    expect(valueContainsKeyValueSecret(value)).toBe(false);
    const result = redact({ value }, { profile: "share" });
    expect(result.value).toEqual({ value });
    expect(result.findings.some((f) => f.detector === "value.keyValueSecret")).toBe(
      false,
    );
  });

  it("covers share and strict profiles for high-confidence credentials", () => {
    const value = "internal_token=synthetic-house-secret-123456";
    for (const profile of ["share", "strict"] as const) {
      const result = redact({ meta: value }, { profile });
      expect(result.value).toEqual({ meta: "[REDACTED]" });
    }
  });

  it("keeps core safety.key-value-secret pattern source in sync", () => {
    const checksSource = readFileSync(
      path.join(repoRoot, "packages/core/src/checks/index.ts"),
      "utf8",
    );
    expect(checksSource).toContain(KEY_VALUE_SECRET_PATTERN_SOURCE);
  });
});
