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
    expect(result.findings?.map((finding) => finding.ruleId)).toContain("safety.rawPrompt");
    expect(result.findings?.map((finding) => finding.ruleId)).toContain("safety.redaction");
    expect(result.findings?.map((finding) => finding.ruleId)).toContain(
      "safety.redactDetector",
    );
    expect(serialized).not.toContain("sk-fixtureSecretValue123456");
    expect(serialized).not.toContain("raw prompt should not leak");
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
    const scan = spawnSync(process.execPath, [cliDist, "scan", "--help"], {
      encoding: "utf-8",
    });
    const verify = spawnSync(process.execPath, [cliDist, "verify-safe", "--help"], {
      encoding: "utf-8",
    });

    expect(scan.status).toBe(0);
    expect(scan.stdout).toContain("Best-effort local safety scan");
    expect(verify.status).toBe(0);
    expect(verify.stdout).toContain("Best-effort local trace safety verification");
  });
});
