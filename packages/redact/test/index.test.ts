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

  it("does not key-redact ls_max_tokens / max_tokens config fields (N-6 parity)", () => {
    const result = redact({
      ls_max_tokens: "undefined",
      max_tokens: 4096,
      access_token: "secret",
    });
    expect(result.value).toEqual({
      ls_max_tokens: "undefined",
      max_tokens: 4096,
      access_token: "[REDACTED]",
    });
  });

  it("redacts camelCase compound credentials without key-redacting maxTokens (#239)", () => {
    const result = redact({
      userPassword: "hunter2",
      user_password: "hunter2",
      clientSecret: "sk-abc",
      maxTokens: 2048,
      tokenLimit: 100,
      emailNote: "owner@example.test",
    });
    expect(result.value).toEqual({
      userPassword: "[REDACTED]",
      user_password: "[REDACTED]",
      clientSecret: "[REDACTED]",
      maxTokens: 2048,
      tokenLimit: 100,
      emailNote: "owner@example.test",
    });
    expect(result.findings.map((f) => f.detector)).toEqual(
      expect.arrayContaining(["key.password", "key.secret"]),
    );
    expect(result.findings.some((f) => f.path === "emailNote" && f.matchKind === "key")).toBe(
      false,
    );
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

  it("redacts framework task/user text keys on share profile", () => {
    const result = redact(
      {
        currentTask: "Summarize the invoice",
        userInput: "Please draft a reply",
        requestText: "What tools are available?",
        conversationText: "hello",
        task: "pilot triage",
        environment: "test",
      },
      { profile: "share" },
    );
    expect(result.value).toEqual({
      currentTask: "[REDACTED]",
      userInput: "[REDACTED]",
      requestText: "[REDACTED]",
      conversationText: "[REDACTED]",
      task: "[REDACTED]",
      environment: "test",
    });
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

  it("does not treat UUIDs, timestamps, or id paths as credit cards", () => {
    const result = redact(
      {
        requestId: "550e8400-e29b-41d4-a716-446655440000",
        startedAt: "1700000000000",
        tokenUsage: { input: "128", output: "64" },
        spanId: "a1b2c3d4e5f60718",
        note: "uuid 550e8400-e29b-41d4-a716-446655440000",
      },
      { profile: "share" },
    );
    expect(result.findings.filter((finding) => finding.detector === "value.creditCard")).toEqual(
      [],
    );
    expect(result.value).toMatchObject({
      startedAt: "1700000000000",
      note: "uuid 550e8400-e29b-41d4-a716-446655440000",
      tokenUsage: { input: "128", output: "64" },
    });
  });

  it("does not treat paths, scoped packages, or source maps as emails", () => {
    const result = redact(
      {
        filePath: "/Users/demo/Library/Caches/@agent-inspect/cache/tmp.json",
        packageName: "@agent-inspect/langchain",
        sourceMap: "webpack:///@agent-inspect/core/dist/index.js",
        homeMail: "/home/pilot.user@example.test/project",
      },
      { profile: "share" },
    );
    expect(result.findings.filter((finding) => finding.detector === "value.email")).toEqual([]);
    expect(result.value).toMatchObject({
      filePath: "/Users/demo/Library/Caches/@agent-inspect/cache/tmp.json",
      packageName: "@agent-inspect/langchain",
      sourceMap: "webpack:///@agent-inspect/core/dist/index.js",
      homeMail: "/home/pilot.user@example.test/project",
    });
  });

  it("still detects plain emails and valid test PANs", () => {
    const email = redact(
      { note: "contact pilot.user@example.test for help" },
      { profile: "share" },
    );
    expect(email.findings.some((finding) => finding.detector === "value.email")).toBe(true);

    const card = redact({ paymentMethod: "4242424242424242" }, { profile: "local" });
    expect(card.findings.some((finding) => finding.detector === "value.creditCard")).toBe(true);
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
