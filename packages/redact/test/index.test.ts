import { describe, expect, it } from "vitest";

import {
  createRedactionProfile,
  createRedactor,
  redact,
  Redactor,
  type RedactionDetector,
  type RedactionFinding,
  type RedactionProfile,
} from "../src/index.js";

describe("@agent-inspect/redact", () => {
  it("redacts default sensitive keys and returns findings", () => {
    const result = redact({ token: "abc", ok: 1 });

    expect(result.value).toEqual({ token: "[REDACTED]", ok: 1 });
    expect(result.redacted).toBe(true);
    expect(result.profile).toBe("local");
    expect(result.findings).toEqual<RedactionFinding[]>([
      {
        path: "token",
        detector: "key.token",
        action: "replace",
        severity: "warning",
        matchKind: "key",
      },
    ]);
  });

  it("does not mutate nested objects or arrays", () => {
    const input = { nested: { password: "p" }, arr: [{ email: "a@example.com" }] };
    const result = redact(input);

    expect(result.value).toEqual({
      nested: { password: "[REDACTED]" },
      arr: [{ email: "[REDACTED]" }],
    });
    expect(input.nested.password).toBe("p");
    expect(input.arr[0]?.email).toBe("a@example.com");
  });

  it("supports share and strict profile keys", () => {
    const share = redact({ correlationId: "corr-1", environment: "test" }, { profile: "share" });
    expect(share.value).toEqual({ correlationId: "[REDACTED]", environment: "test" });

    const strict = redact({ prompt: "hidden", model: "fixture" }, { profile: "strict" });
    expect(strict.value).toEqual({ prompt: "[REDACTED]", model: "fixture" });
  });

  it("applies profile strength predictably", () => {
    const local = redact({ note: "email person@example.com", prompt: "visible" });
    expect(local.value).toEqual({ note: "email person@example.com", prompt: "visible" });

    const share = redact(
      { note: "email person@example.com", prompt: "still visible" },
      { profile: "share" },
    );
    expect(share.value).toEqual({ note: "[REDACTED]", prompt: "still visible" });

    const strict = redact(
      { note: "email person@example.com", prompt: "hidden" },
      { profile: "strict" },
    );
    expect(strict.value).toEqual({ note: "[REDACTED]", prompt: "[REDACTED]" });
  });

  it.each([
    ["value.email", "contact person@example.com", "share"],
    ["value.phone", "+1 (415) 555-1212", "share"],
    ["value.authorizationHeader", "Bearer abcdefghijklmnop", "local"],
    ["value.bearerToken", "Authorization: Bearer abcdefghijklmnop", "local"],
    ["value.cookie", "session=abc; csrftoken=def", "local"],
    ["value.jwt", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.VTJGc2RHVmtYMThhYlhSMFlR", "local"],
    ["value.providerApiKey", "sk-proj-abcdefghijklmnopqrstuvwxyz", "local"],
    ["value.githubToken", "ghp_abcdefghijklmnopqrstuvwxyz123456", "local"],
    ["value.awsAccessKey", "AKIAIOSFODNN7EXAMPLE", "local"],
    [
      "value.privateKey",
      "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
      "local",
    ],
    ["value.creditCard", "4242 4242 4242 4242", "local"],
    ["value.ipv4", "192.168.1.10", "share"],
    ["value.ipv6", "2001:0db8:85a3:0000:0000:8a2e:0370:7334", "share"],
  ] as const)("detects %s", (detector, value, profile) => {
    const result = redact({ value }, { profile });

    expect(result.value).toEqual({ value: "[REDACTED]" });
    expect(result.findings).toContainEqual({
      path: "value",
      detector,
      action: "replace",
      severity: detector.startsWith("value.email") ||
        detector.startsWith("value.phone") ||
        detector.startsWith("value.ip")
        ? "warning"
        : "error",
      matchKind: "value",
    });
    expect(JSON.stringify(result.findings)).not.toContain(value);
  });

  it("does not redact invalid credit-card-like strings that fail Luhn", () => {
    const result = redact({ value: "4242 4242 4242 4241" }, { profile: "share" });
    expect(result.value).toEqual({ value: "4242 4242 4242 4241" });
    expect(result.findings).toEqual([]);
  });

  it("supports prefix and hash rules compatibly", () => {
    const redactor = createRedactor({
      rules: [
        { key: "userUuid", strategy: "prefix", keep: 4 },
        { key: "email", strategy: "hash" },
      ],
    });

    const first = redactor.redact({ userUuid: "abcdef", email: "a@example.com" });
    const second = redactor.redact({ email: "a@example.com" });

    expect(first.value).toMatchObject({ userUuid: "abcd…" });
    expect(String((first.value as { email: unknown }).email)).toMatch(/^\[HASH:[0-9a-f]{8}\]$/);
    expect((first.value as { email: unknown }).email).toBe(
      (second.value as { email: unknown }).email,
    );
  });

  it("supports custom detectors", () => {
    const detector: RedactionDetector = {
      id: "custom.fixture",
      detect(input) {
        return input.value === "needle"
          ? [{ action: "replace", severity: "error", replacement: "[CUSTOM]" }]
          : [];
      },
    };

    const result = redact({ safe: "ok", customField: "needle" }, { detectors: [detector] });

    expect(result.value).toEqual({ safe: "ok", customField: "[CUSTOM]" });
    expect(result.findings).toContainEqual({
      path: "customField",
      detector: "custom.fixture",
      action: "replace",
      severity: "error",
      matchKind: "custom",
    });
  });

  it("exports profile helpers and class API", () => {
    const profile: RedactionProfile = "strict";
    expect(createRedactionProfile(profile).extraKeys).toContain("prompt");
    expect(new Redactor().redactRecord({ Authorization: "bearer x" })).toEqual({
      Authorization: "[REDACTED]",
    });
  });
});
