import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { redactCommand } from "../src/redact.js";
import {
  MAX_POLICY_FILE_BYTES,
  MAX_POLICY_RULES,
  compileRedactionPolicy,
  loadRedactionPolicy,
} from "../src/redaction-policy.js";
import { verifySafeCommand } from "../src/safety.js";

const VALID_POLICY = {
  policyVersion: 1,
  sensitiveKeys: ["houseSecret"],
  valuePatterns: [
    { id: "house-prefix", type: "prefix", prefix: "hsk_", severity: "error" },
    { id: "house-kv", type: "key-value", key: "house_token", severity: "error" },
  ],
};

function event(attributes: Record<string, unknown>): string {
  return `${JSON.stringify({
    schemaVersion: "0.2",
    eventId: "event-a",
    runId: "run-policy",
    kind: "RUN",
    name: "policy",
    status: "ok",
    timestamp: "2026-06-26T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    attributes,
  })}\n`;
}

describe("bounded local redaction policy (#329)", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-policy-"));
    process.exitCode = 0;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  async function writePolicy(document: unknown, name = "policy.json"): Promise<string> {
    const file = path.join(tmp, name);
    await writeFile(file, JSON.stringify(document), "utf-8");
    return file;
  }

  async function writeTrace(name: string, content: string): Promise<string> {
    const file = path.join(tmp, name);
    await writeFile(file, content, "utf-8");
    return file;
  }

  async function jsonOutput(run: () => Promise<void>): Promise<Record<string, unknown>> {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await run();
    const output = String(logSpy.mock.calls[0]?.[0] ?? "{}");
    logSpy.mockRestore();
    return JSON.parse(output) as Record<string, unknown>;
  }

  describe("validation", () => {
    it("compiles a valid policy", () => {
      const policy = compileRedactionPolicy(VALID_POLICY, "policy.json");

      expect(policy.policyVersion).toBe(1);
      expect(policy.sensitiveKeys).toEqual(["houseSecret"]);
      expect(policy.detectors.map((detector) => detector.id)).toEqual([
        "policy.house-prefix",
        "policy.house-kv",
      ]);
    });

    it.each([
      [{ policyVersion: 2 }, "policyVersion"],
      [{ policyVersion: 1, detectors: [] }, "unsupported field"],
      [{ policyVersion: 1, sensitiveKeys: "token" }, "must be an array"],
      [{ policyVersion: 1, sensitiveKeys: ["a".repeat(200)] }, "at most 128 characters"],
      [{ policyVersion: 1, sensitiveKeys: ["bad key"] }, "may only contain"],
      [
        { policyVersion: 1, valuePatterns: [{ id: "r", type: "regex", pattern: ".*" }] },
        'must be "prefix" or "key-value"',
      ],
      [
        { policyVersion: 1, valuePatterns: [{ id: "r", type: "prefix", prefix: "a" }] },
        "at least 3 characters",
      ],
      [
        {
          policyVersion: 1,
          valuePatterns: [{ id: "r", type: "prefix", prefix: "a".repeat(100) }],
        },
        "at most 64 characters",
      ],
      [
        {
          policyVersion: 1,
          valuePatterns: [{ id: "r", type: "prefix", prefix: "abc", pattern: ".*" }],
        },
        "unsupported field",
      ],
      [
        {
          policyVersion: 1,
          valuePatterns: [
            { id: "dup", type: "prefix", prefix: "abc" },
            { id: "dup", type: "prefix", prefix: "xyz" },
          ],
        },
        "duplicated",
      ],
      [
        {
          policyVersion: 1,
          valuePatterns: [{ id: "r", type: "key-value", key: "k", minSecretLength: 0 }],
        },
        "positive integer",
      ],
      [
        {
          policyVersion: 1,
          valuePatterns: [{ id: "r", type: "key-value", key: "k", severity: "critical" }],
        },
        'must be "warning" or "error"',
      ],
    ])("rejects %#", (document, expected) => {
      expect(() => compileRedactionPolicy(document, "policy.json")).toThrow(
        expect.objectContaining({ message: expect.stringContaining(expected) }),
      );
    });

    it("rejects more rules than the bound allows", () => {
      const sensitiveKeys = Array.from({ length: MAX_POLICY_RULES + 1 }, (_, i) => `key${i}`);

      expect(() => compileRedactionPolicy({ policyVersion: 1, sensitiveKeys }, "p.json")).toThrow(
        /the maximum is 200/,
      );
    });

    it("rejects remote policy locations", async () => {
      await expect(loadRedactionPolicy("https://example.test/policy.json")).rejects.toThrow(
        /remote policy URLs are not supported/,
      );
    });

    it("rejects an oversized policy file", async () => {
      const file = path.join(tmp, "big.json");
      await writeFile(
        file,
        JSON.stringify({
          policyVersion: 1,
          sensitiveKeys: ["padded"],
          valuePatterns: [
            { id: "pad", type: "prefix", prefix: `x${"y".repeat(MAX_POLICY_FILE_BYTES)}` },
          ],
        }),
        "utf-8",
      );

      await expect(loadRedactionPolicy(file)).rejects.toThrow(/the maximum is 65536 bytes/);
    });

    it("rejects a missing file and malformed JSON", async () => {
      await expect(loadRedactionPolicy(path.join(tmp, "nope.json"))).rejects.toThrow(
        /file not found/,
      );

      const broken = path.join(tmp, "broken.json");
      await writeFile(broken, "{ not json", "utf-8");
      await expect(loadRedactionPolicy(broken)).rejects.toThrow(/is not valid JSON/);
    });

    it("treats interpolation-looking text as literal and rejects it by charset", () => {
      expect(() =>
        compileRedactionPolicy(
          { policyVersion: 1, sensitiveKeys: ["${HOME}"] },
          "policy.json",
        ),
      ).toThrow(/may only contain/);
    });
  });

  describe("redact --policy", () => {
    it("redacts org-specific keys, prefixes, and key-value forms", async () => {
      const policyPath = await writePolicy(VALID_POLICY);
      const file = await writeTrace(
        "trace.jsonl",
        event({
          houseSecret: "house-secret-value-1",
          prefixed: "hsk_abcdefghijklmno",
          embedded: "config house_token=abcdefghijklmno end",
          safe: "nothing sensitive",
          maxTokens: 4096,
        }),
      );

      const result = (await jsonOutput(() =>
        redactCommand(file, { json: true, profile: "share", policy: policyPath }),
      )) as { content?: string; findings?: { detector?: string }[]; policy?: unknown };

      expect(result.content).not.toContain("house-secret-value-1");
      expect(result.content).not.toContain("hsk_abcdefghijklmno");
      expect(result.content).not.toContain("house_token=abcdefghijklmno");
      expect(result.content).toContain("nothing sensitive");
      expect(result.content).toContain("4096");
      const detectors = result.findings?.map((finding) => finding.detector) ?? [];
      expect(detectors).toContain("policy.house-prefix");
      expect(detectors).toContain("policy.house-kv");
      expect(result.policy).toEqual({
        policyVersion: 1,
        sensitiveKeys: 1,
        valuePatterns: 2,
        source: policyPath,
      });
      expect(JSON.stringify(result.findings)).not.toContain("abcdefghijklmno");
    });

    it("cannot disable built-in high-confidence protection", async () => {
      const policyPath = await writePolicy({ policyVersion: 1, sensitiveKeys: ["houseSecret"] });
      const file = await writeTrace(
        "builtin.jsonl",
        event({ note: "Bearer sk-fixtureSecretValue123456789" }),
      );

      const result = (await jsonOutput(() =>
        redactCommand(file, { json: true, profile: "share", policy: policyPath }),
      )) as { content?: string };

      expect(result.content).not.toContain("sk-fixtureSecretValue123456789");
      expect(result.content).toContain("[REDACTED]");
    });

    it("does not match a bounded pattern glued inside a longer token", async () => {
      const policyPath = await writePolicy(VALID_POLICY);
      const file = await writeTrace(
        "boundary.jsonl",
        event({ note: "xhsk_abcdefghijklmno", short: "hsk_abc" }),
      );

      const result = (await jsonOutput(() =>
        redactCommand(file, { json: true, profile: "share", policy: policyPath }),
      )) as { content?: string };

      expect(result.content).toContain("xhsk_abcdefghijklmno");
      expect(result.content).toContain("hsk_abc");
    });

    it("reports an actionable error for an invalid policy", async () => {
      const bad = await writePolicy({ policyVersion: 9 }, "bad.json");
      const file = await writeTrace("t.jsonl", event({ safe: "ok" }));

      await expect(
        redactCommand(file, { json: true, profile: "share", policy: bad }),
      ).rejects.toThrow(/^--policy /);
    });
  });

  describe("verify-safe --policy", () => {
    it("applies the same compiled policy and reports it deterministically", async () => {
      const policyPath = await writePolicy(VALID_POLICY);
      const file = await writeTrace(
        "verify.jsonl",
        event({ embedded: "config house_token=abcdefghijklmno end" }),
      );

      const result = (await jsonOutput(() =>
        verifySafeCommand(file, { json: true, policy: undefined, policyPath }),
      )) as {
        policy?: { sensitiveKeys?: number; valuePatterns?: number };
        redactionSummary?: { detectors?: string[] };
      };

      expect(result.policy).toEqual({
        policyVersion: 1,
        sensitiveKeys: 1,
        valuePatterns: 2,
        source: policyPath,
      });
      expect(result.redactionSummary?.detectors).toContain("policy.house-kv");
      expect(JSON.stringify(result)).not.toContain("abcdefghijklmno");
    });

    it("reports an invalid policy as an argument diagnostic instead of crashing", async () => {
      const bad = await writePolicy({ policyVersion: 1, valuePatterns: "nope" }, "bad.json");
      const file = await writeTrace("verify-bad.jsonl", event({ safe: "ok" }));

      const result = (await jsonOutput(() =>
        verifySafeCommand(file, { json: true, policyPath: bad }),
      )) as { status?: string; diagnostics?: { code?: string }[] };

      expect(result.status).toBe("UNKNOWN");
      expect(result.diagnostics?.[0]?.code).toBe("AI_SAFETY_INVALID_ARGUMENTS");
      expect(process.exitCode).toBe(2);
    });
  });
});
