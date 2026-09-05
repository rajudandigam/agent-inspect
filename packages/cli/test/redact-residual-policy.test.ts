import { PassThrough } from "node:stream";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { redactCommand } from "../src/redact.js";
import {
  compileRedactionPolicy,
  loadRedactionPolicy,
  REDACTION_POLICY_LIMITS,
} from "../src/redaction-policy.js";

function stdinFrom(text: string): NodeJS.ReadableStream {
  const stream = new PassThrough();
  stream.end(text);
  return stream;
}

function jsonl(row: unknown): string {
  return `${JSON.stringify(row)}\n`;
}

function event(attributes: Record<string, unknown>): string {
  return jsonl({
    schemaVersion: "0.2",
    eventId: "event-a",
    runId: "run-residual-policy",
    kind: "RUN",
    name: "residual-policy",
    status: "ok",
    timestamp: "2026-06-26T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    attributes,
  });
}

describe("redact residual assessment (#328)", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-residual-"));
    process.exitCode = 0;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  it("adds residualAssessment to JSON without changing default exit code", async () => {
    const file = path.join(tmp, "safe.jsonl");
    await writeFile(file, event({ note: "ok" }), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await redactCommand(file, { json: true, profile: "share" });

    const result = JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "{}")) as {
      residualAssessment?: { status?: string; codes?: string[]; note?: string };
      findings?: unknown[];
    };
    expect(process.exitCode ?? 0).toBe(0);
    expect(result.residualAssessment?.status).toBeDefined();
    expect(result.residualAssessment?.note).toContain("Best-effort");
    expect(JSON.stringify(result)).not.toMatch(/sk-|Bearer |password=/i);
    expect(errSpy).not.toHaveBeenCalled();
  });

  it("warns on stderr in human mode when residual is not SAFE", async () => {
    const file = path.join(tmp, "paths.jsonl");
    // Private filesystem paths often remain as residual context-sensitive findings.
    await writeFile(
      file,
      event({
        workspacePath: "/Users/private-user/secret-project/src/index.ts",
        note: "review",
      }),
      "utf-8",
    );
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await redactCommand(file, { profile: "share" });

    expect(process.exitCode ?? 0).toBe(0);
    const stderr = errSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    if (stderr.includes("Residual safety:")) {
      expect(stderr).toMatch(/Residual safety: (SAFE_WITH_WARNINGS|UNSAFE|UNKNOWN)/);
      expect(stderr).not.toContain("/Users/private-user");
    }
    expect(writeSpy).toHaveBeenCalled();
  });

  it("supports --fail-on-residual opt-in exit codes", async () => {
    const file = path.join(tmp, "plain.json");
    await writeFile(file, JSON.stringify({ hello: "world" }), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await redactCommand(file, { json: true, failOnResidual: true, profile: "share" });

    const result = JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "{}")) as {
      residualAssessment?: { status?: string };
    };
    // Arbitrary JSON is not a supported AgentInspect trace → UNKNOWN residual.
    expect(result.residualAssessment?.status).toBe("UNKNOWN");
    expect(process.exitCode).toBe(2);
  });

  it("never prints matched secret values in residual output", async () => {
    const secret = "sk-fixtureResidualSecretValue123456789";
    const file = path.join(tmp, "secret.jsonl");
    await writeFile(file, event({ apiKey: secret, note: "x" }), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await redactCommand(file, { json: true, profile: "share" });

    const payload = String(logSpy.mock.calls[0]?.[0] ?? "");
    const stderr = errSpy.mock.calls.map((c) => String(c[0] ?? "")).join("\n");
    expect(payload).not.toContain(secret);
    expect(stderr).not.toContain(secret);
    expect(payload).toContain("[REDACTED]");
  });
});

describe("bounded redaction policy (#329)", () => {
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

  it("compiles extraKeys and bounded patterns deterministically", () => {
    const compiled = compileRedactionPolicy(
      {
        version: 1,
        extraKeys: ["houseToken"],
        patterns: [
          { id: "houseLiteral", type: "literal", value: "HOUSE_MARK" },
          { id: "housePrefix", type: "prefix", value: "hsec_" },
          { id: "houseTyped", type: "typed", pattern: "hsec_[A-Za-z0-9]{8,24}" },
        ],
      },
      "/tmp/policy.json",
    );
    expect(compiled.extraKeys).toEqual(["houseToken"]);
    expect(compiled.detectors.map((d) => d.id)).toEqual([
      "policy.houseLiteral",
      "policy.housePrefix",
      "policy.houseTyped",
    ]);
  });

  it("rejects remote policy URLs and unbounded patterns", async () => {
    await expect(loadRedactionPolicy("https://example.test/policy.json")).rejects.toThrow(
      /local JSON file path/,
    );

    expect(() =>
      compileRedactionPolicy(
        {
          patterns: [{ id: "bad", type: "typed", pattern: "(a+)+" }],
        },
        "policy.json",
      ),
    ).toThrow(/nested quantifiers|unbounded/);

    expect(() =>
      compileRedactionPolicy(
        {
          patterns: Array.from({ length: REDACTION_POLICY_LIMITS.maxPatterns + 1 }, (_, i) => ({
            id: `p${i}`,
            type: "literal",
            value: "x",
          })),
        },
        "policy.json",
      ),
    ).toThrow(/max count/);
  });

  it("applies the same policy to redact and residual detection", async () => {
    const policyPath = path.join(tmp, "policy.json");
    await writeFile(
      policyPath,
      JSON.stringify({
        version: 1,
        extraKeys: ["houseToken"],
        patterns: [{ id: "houseCred", type: "literal", value: "HOUSE_CREDENTIAL_MARK" }],
      }),
      "utf-8",
    );
    const file = path.join(tmp, "custom.jsonl");
    await writeFile(
      file,
      event({
        houseToken: "should-redact-by-key",
        note: "prefix HOUSE_CREDENTIAL_MARK suffix",
        safe: "ok",
      }),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await redactCommand(file, { json: true, profile: "share", policy: policyPath });

    const result = JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "{}")) as {
      content?: string;
      findings?: { detector?: string }[];
      residualAssessment?: { status?: string };
      policy?: { extraKeys?: number; patterns?: number };
    };
    expect(result.policy).toEqual({
      path: path.resolve(policyPath),
      extraKeys: 1,
      patterns: 1,
      diagnostics: [],
    });
    expect(result.content).toContain("[REDACTED]");
    expect(result.content).not.toContain("should-redact-by-key");
    expect(result.content).not.toContain("HOUSE_CREDENTIAL_MARK");
    expect(result.findings?.some((f) => f.detector === "key.housetoken")).toBe(true);
    expect(result.findings?.some((f) => f.detector === "policy.houseCred")).toBe(true);
    expect(JSON.stringify(result.findings)).not.toContain("should-redact-by-key");
    expect(result.residualAssessment?.status).toBeDefined();
  });

  it("does not accept secrets on argv (policy path only)", async () => {
    // Ensure redact still works when policy is omitted and no secret flags exist.
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await redactCommand("-", { json: true, profile: "share" }, stdinFrom(event({ safe: "ok" })));
    expect(process.exitCode ?? 0).toBe(0);
    expect(logSpy).toHaveBeenCalled();
  });
});
