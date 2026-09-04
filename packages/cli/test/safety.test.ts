import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { scanCommand, verifySafeCommand } from "../src/safety.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const cliDist = path.join(repoRoot, "packages/cli/dist/index.cjs");
const builtCliHasSafetyCommands =
  existsSync(cliDist) &&
  readFileSync(cliDist, "utf-8").includes("Best-effort local trace safety verification");

function jsonl(...rows: unknown[]): string {
  return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

function event(
  eventId: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: "0.2",
    eventId,
    runId: "run-safety-cli",
    kind: "RUN",
    name: "safety-cli",
    status: "ok",
    timestamp: "2026-06-26T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

async function writeTrace(dir: string, name: string, content: string): Promise<string> {
  const file = path.join(dir, name);
  await writeFile(file, content, "utf-8");
  return file;
}

async function runSafety(
  command: typeof scanCommand,
  target: string,
  options: Parameters<typeof scanCommand>[1] = {},
) {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  await command(target, { json: true, ...options });
  const output = String(logSpy.mock.calls[0]?.[0] ?? "{}");
  logSpy.mockRestore();
  return JSON.parse(output) as {
    status?: string;
    note?: string;
    diagnostics?: { code?: string; message?: string }[];
    findings?: { ruleId?: string; message?: string }[];
    warnings?: { code?: string }[];
    sourceAssessment?: { status?: string };
    artifactAssessment?: { status?: string };
    redactionSummary?: { profile?: string; findings?: number };
  };
}

describe("scan and verify-safe commands", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-safety-"));
    process.exitCode = 0;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  it("reports SAFE for a local trace without safety findings", async () => {
    const file = await writeTrace(tmp, "safe.jsonl", jsonl(event("event-a")));

    const result = await runSafety(scanCommand, file);

    expect(process.exitCode).toBe(0);
    expect(result.status).toBe("SAFE");
    expect(result.findings).toEqual([]);
    expect(result.note).toContain("Best-effort local safety verification");
  });

  it("reports SAFE WITH WARNINGS when the reader normalizes with warnings", async () => {
    const file = await writeTrace(
      tmp,
      "warn.jsonl",
      `not-json\n${jsonl(event("event-a"))}`,
    );

    const result = await runSafety(scanCommand, file);

    expect(process.exitCode).toBe(0);
    expect(result.status).toBe("SAFE WITH WARNINGS");
    expect(result.warnings?.[0]?.code).toBe("invalid_jsonl_rows");
  });

  it("reports UNSAFE findings without leaking raw prompt or secret values", async () => {
    const file = await writeTrace(
      tmp,
      "unsafe.jsonl",
      jsonl(
        event("event-a", {
          attributes: {
            apiKey: "sk-fixtureSecretValue123456",
            prompt: "raw prompt should not leak",
          },
        }),
      ),
    );

    const result = await runSafety(verifySafeCommand, file);
    const serialized = JSON.stringify(result);

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("UNSAFE");
    expect(result.sourceAssessment?.status).toBe("UNSAFE");
    expect(result.artifactAssessment?.status).toBeDefined();
    expect(result.redactionSummary?.profile).toBe("share");
    expect(result.findings?.map((finding) => finding.ruleId)).toContain("safety.rawPrompt");
    expect(serialized).not.toContain("sk-fixtureSecretValue123456");
    expect(serialized).not.toContain("raw prompt should not leak");
  });

  it("gates verify-safe status on the redacted artifact when source-only issues redact away", async () => {
    const file = await writeTrace(
      tmp,
      "source-unsafe-artifact-safe.jsonl",
      jsonl(
        event("event-a", {
          attributes: {
            contact: "pilot.user@example.test",
            token: "sk-abcdefghijklmnopqrstuvwxyz12",
          },
        }),
      ),
    );

    const scan = await runSafety(scanCommand, file);
    expect(scan.status).toBe("UNSAFE");

    const verified = await runSafety(verifySafeCommand, file);
    expect(verified.sourceAssessment?.status).toBe("UNSAFE");
    expect(["SAFE", "SAFE WITH WARNINGS"]).toContain(verified.artifactAssessment?.status);
    expect(["SAFE", "SAFE WITH WARNINGS"]).toContain(verified.status);
    expect(process.exitCode).toBe(0);
    expect(verified.redactionSummary?.findings).toBeGreaterThan(0);
  });

  it("redacts key/value credentials so artifact verify-safe no longer reports key-value-secret (#327)", async () => {
    const secret = "internal_token=synthetic-house-secret-123456";
    const file = await writeTrace(
      tmp,
      "kv-secret.jsonl",
      jsonl(
        event("event-a", {
          attributes: {
            note: secret,
            pathHint: "/Users/synthetic/.ssh/id_rsa",
          },
        }),
      ),
    );

    const scan = await runSafety(scanCommand, file);
    expect(scan.findings?.some((f) => f.message?.includes("key-value-secret"))).toBe(true);

    const verified = await runSafety(verifySafeCommand, file);
    const artifactFindings = JSON.stringify(verified.artifactAssessment ?? verified);
    expect(artifactFindings).not.toContain("synthetic-house-secret-123456");
    expect(JSON.stringify(verified.findings ?? [])).not.toContain(
      "synthetic-house-secret-123456",
    );
    // Path findings may remain verifier-only; credential KV must not remain on artifact.
    const kvStillPresent = (verified.findings ?? []).some(
      (f) =>
        f.ruleId === "safety.secretPattern" &&
        (f.message?.includes("key-value-secret") ?? false),
    );
    // After share redaction, verify-safe findings are from the artifact assessment path.
    expect(verified.redactionSummary?.findings).toBeGreaterThan(0);
    expect(kvStillPresent).toBe(false);
  });

  it("explains findings without leaking matched values", async () => {
    const secret = "sk-explainSecretValue1234567890";
    const file = await writeTrace(
      tmp,
      "explain.jsonl",
      jsonl(
        event("event-a", {
          attributes: { apiKey: secret, prompt: "hidden prompt text" },
        }),
      ),
    );

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    process.exitCode = 0;
    await scanCommand(file, { explain: true });
    const human = logSpy.mock.calls.map((call) => String(call[0])).join("\n");
    logSpy.mockClear();
    await scanCommand(file, { json: true, explain: true });
    const json = JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "{}")) as {
      explanations?: { ruleId?: string; path?: string; blocksBundle?: boolean }[];
    };
    logSpy.mockRestore();

    expect(human).toContain("Confidence:");
    expect(human).toContain("Bundle gate:");
    expect(human).not.toContain(secret);
    expect(human).not.toContain("hidden prompt text");
    expect(json.explanations?.length).toBeGreaterThan(0);
    expect(JSON.stringify(json)).not.toContain(secret);
  });

  it("reports UNKNOWN for unsupported inputs", async () => {
    const file = await writeTrace(tmp, "unsupported.json", "{\"hello\":\"world\"}\n");

    const result = await runSafety(verifySafeCommand, file);

    expect(process.exitCode).toBe(2);
    expect(result.status).toBe("UNKNOWN");
    expect(result.diagnostics?.[0]?.code).toBe("AI_SAFETY_UNSUPPORTED_FORMAT");
  });
});

describe.skipIf(!builtCliHasSafetyCommands)("built safety CLI", () => {
  it("renders scan and verify-safe help from the built command", () => {
    const childEnv = { ...process.env, NODE_OPTIONS: "" };
    const scan = spawnSync(process.execPath, [cliDist, "scan", "--help"], {
      encoding: "utf-8",
      env: childEnv,
      maxBuffer: 4 * 1024 * 1024,
    });
    const verify = spawnSync(process.execPath, [cliDist, "verify-safe", "--help"], {
      encoding: "utf-8",
      env: childEnv,
      maxBuffer: 4 * 1024 * 1024,
    });

    expect(scan.error, scan.stderr).toBeUndefined();
    expect(scan.status, scan.stderr).toBe(0);
    expect(scan.stdout).toContain("Best-effort local safety scan");
    expect(verify.error, verify.stderr).toBeUndefined();
    expect(verify.status, verify.stderr).toBe(0);
    expect(verify.stdout).toContain("Best-effort local trace safety verification");
  });
});
