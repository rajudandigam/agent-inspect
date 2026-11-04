import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { gateCommand } from "../src/gate.js";

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
    runId: "run-gate-evidence",
    kind: "TOOL",
    name: "issue_refund",
    status: "ok",
    timestamp: "2026-06-26T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    attributes: { toolName: "issue_refund" },
    ...overrides,
  };
}

describe("gate --evidence-on residual aggregateStatus (#529)", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-gate-ev-"));
    process.exitCode = 0;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  async function writeRun(dir: string, name: string, rows: unknown[]): Promise<string> {
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${name}.jsonl`);
    await writeFile(file, jsonl(...rows), "utf-8");
    return file;
  }

  function readStatuses(evidenceDir: string): {
    assessment: string | undefined;
    aggregateStatus: string | undefined;
    gateStatus: string | undefined;
  } {
    const evidence = JSON.parse(
      readFileSync(path.join(evidenceDir, "evidence.json"), "utf-8"),
    ) as { assessment?: { status?: string } };
    const checks = JSON.parse(
      readFileSync(path.join(evidenceDir, "check-results.json"), "utf-8"),
    ) as { aggregateStatus?: string; gateStatus?: string };
    return {
      assessment: evidence.assessment?.status,
      aggregateStatus: checks.aggregateStatus,
      gateStatus: checks.gateStatus,
    };
  }

  it("keeps gate pass/fail separate from residual artifact safety", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Gate passes; share-redacted glued OpenAI key leaves residual UNSAFE.
    const unsafeDir = path.join(tmp, "unsafe");
    const glued = "acct_sk-proj-FAKEevalNOTrealKEY000000";
    await writeRun(unsafeDir, "run-unsafe", [
      event("tool-1", {
        runId: "run-unsafe",
        attributes: {
          toolName: "issue_refund",
          paymentRef: glued,
        },
      }),
    ]);
    const unsafeEvidence = path.join(tmp, "ev-unsafe");
    process.exitCode = 0;
    await gateCommand({
      dir: unsafeDir,
      maxErrorRate: "100",
      evidenceOn: "always",
      evidenceDir: unsafeEvidence,
      evidenceProfile: "share",
      json: true,
    });
    expect(process.exitCode ?? 0).toBe(0);
    expect(existsSync(path.join(unsafeEvidence, "evidence.json"))).toBe(true);
    const unsafe = readStatuses(unsafeEvidence);
    expect(unsafe.assessment).toBe("UNSAFE");
    expect(unsafe.aggregateStatus).toBe("UNSAFE");
    expect(unsafe.gateStatus).toBe("pass");

    // Gate fails (forbidden tool); artifact is clean → SAFE.
    const cleanDir = path.join(tmp, "clean");
    await writeRun(cleanDir, "run-clean", [
      event("tool-1", {
        runId: "run-clean",
        attributes: { toolName: "issue_refund" },
      }),
    ]);
    const cleanEvidence = path.join(tmp, "ev-clean");
    process.exitCode = 0;
    await gateCommand({
      dir: cleanDir,
      forbidTool: "issue_refund",
      evidenceOn: "always",
      evidenceDir: cleanEvidence,
      evidenceProfile: "share",
      json: true,
    });
    expect(process.exitCode).toBeGreaterThan(0);
    const clean = readStatuses(cleanEvidence);
    expect(clean.assessment).toBe("SAFE");
    expect(clean.aggregateStatus).toBe("SAFE");
    expect(clean.gateStatus).toBe("fail");

    logSpy.mockRestore();
    errSpy.mockRestore();
  });
});
