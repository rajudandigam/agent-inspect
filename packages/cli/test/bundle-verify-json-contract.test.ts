/**
 * Regression contract for `bundle verify --json`.
 *
 * CI gates and support scripts parse this payload, so the field names and
 * shapes must not drift silently. Pins the success shape and the failure
 * shapes for the tamper, unexpected-file, and missing-manifest paths.
 */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bundleCommand } from "../src/bundle.js";
import { bundleVerifyCommand } from "../src/bundle-verify.js";

interface VerifyIssue {
  code: string;
  severity: string;
  message: string;
  path: string;
}

interface VerifyPayload {
  ok: boolean;
  status: string;
  root: string;
  checkedFiles: number;
  issues: VerifyIssue[];
  assessment?: { note: string; sourceStatus: string; status: string };
  generator?: { name: string; version: string };
}

const failurePayloadKeys = ["checkedFiles", "issues", "ok", "root", "status"];

function jsonl(...rows: unknown[]): string {
  return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

function runEvent(): Record<string, unknown> {
  return {
    schemaVersion: "0.2",
    eventId: "e1",
    runId: "run-contract",
    kind: "RUN",
    name: "contract",
    status: "ok",
    timestamp: "2026-06-26T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
  };
}

describe("bundle verify --json contract", () => {
  let tmp: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-verify-contract-"));
    process.exitCode = 0;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    await writeFile(path.join(tmp, "run-contract.jsonl"), jsonl(runEvent()), "utf-8");
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  async function bundleOut(name: string): Promise<string> {
    const out = path.join(tmp, name);
    await bundleCommand("run-contract", { dir: tmp, out, json: true });
    logSpy.mockClear();
    return out;
  }

  function lastPayload(): VerifyPayload {
    return JSON.parse(String(logSpy.mock.calls.at(-1)?.[0])) as VerifyPayload;
  }

  it("pins the success payload shape", async () => {
    const out = await bundleOut("ok-bundle");
    await bundleVerifyCommand(out, { json: true });

    const payload = lastPayload();
    expect(Object.keys(payload).sort()).toEqual([
      "assessment",
      "checkedFiles",
      "generator",
      "issues",
      "ok",
      "root",
      "status",
    ]);
    expect(payload.ok).toBe(true);
    expect(payload.status).toBe("pass");
    expect(typeof payload.root).toBe("string");
    expect(typeof payload.checkedFiles).toBe("number");
    expect(payload.checkedFiles).toBeGreaterThan(0);
    expect(payload.issues).toEqual([]);
    expect(Object.keys(payload.assessment!).sort()).toEqual([
      "note",
      "sourceStatus",
      "status",
    ]);
    expect(payload.generator!.name).toBe("agent-inspect");
    expect(typeof payload.generator!.version).toBe("string");
    expect(process.exitCode ?? 0).toBe(0);
  });

  it("pins the tamper failure payload shape", async () => {
    const out = await bundleOut("tamper-bundle");
    await writeFile(path.join(out, "trace.jsonl"), "tampered\n", "utf-8");
    await bundleVerifyCommand(out, { json: true });

    const payload = lastPayload();
    expect(payload.ok).toBe(false);
    expect(payload.status).toBe("fail");
    expect(payload.issues.length).toBeGreaterThan(0);
    const issue = payload.issues[0]!;
    expect(Object.keys(issue).sort()).toEqual(["code", "message", "path", "severity"]);
    expect(issue.code).toBe("hash_mismatch");
    expect(issue.severity).toBe("error");
    expect(issue.path).toBe("trace.jsonl");
    expect(process.exitCode).toBe(1);
  });

  it("flags an unexpected file and treats warnings as non-failing", async () => {
    const out = await bundleOut("unexpected-bundle");
    await writeFile(path.join(out, "stray.txt"), "x\n", "utf-8");

    await bundleVerifyCommand(out, { json: true });
    const failed = lastPayload();
    expect(failed.status).toBe("fail");
    expect(failed.issues[0]?.code).toBe("file_unexpected");
    expect(failed.issues[0]?.severity).toBe("error");
    expect(process.exitCode).toBe(1);

    process.exitCode = 0;
    logSpy.mockClear();
    await bundleVerifyCommand(out, { json: true, unexpected: "warn" });
    const warned = lastPayload();
    expect(warned.status).toBe("pass");
    expect(warned.ok).toBe(true);
    expect(warned.issues[0]?.severity).toBe("warning");
    expect(process.exitCode ?? 0).toBe(0);
  });

  it("reports a missing manifest deterministically", async () => {
    const out = await bundleOut("missing-manifest-bundle");
    await rm(path.join(out, "evidence.json"));

    await bundleVerifyCommand(out, { json: true });
    const payload = lastPayload();
    expect(Object.keys(payload).sort()).toEqual(failurePayloadKeys);
    expect(payload.ok).toBe(false);
    expect(payload.status).toBe("fail");
    expect(typeof payload.root).toBe("string");
    expect(payload.checkedFiles).toBe(0);
    expect(Array.isArray(payload.issues)).toBe(true);
    expect(payload.issues[0]?.code).toBe("manifest_missing");
    expect(payload.issues[0]?.path).toBe("evidence.json");
    expect(process.exitCode).toBe(1);
  });

  it("reports a malformed manifest deterministically", async () => {
    const out = await bundleOut("malformed-manifest-bundle");
    await writeFile(path.join(out, "evidence.json"), "{invalid json\n", "utf-8");

    await bundleVerifyCommand(out, { json: true });
    const payload = lastPayload();
    expect(Object.keys(payload).sort()).toEqual(failurePayloadKeys);
    expect(payload.ok).toBe(false);
    expect(payload.status).toBe("fail");
    expect(typeof payload.root).toBe("string");
    expect(payload.checkedFiles).toBe(0);
    expect(Array.isArray(payload.issues)).toBe(true);
    expect(payload.issues[0]?.code).toBe("manifest_invalid");
    expect(payload.issues[0]?.path).toBe("evidence.json");
    expect(process.exitCode).toBe(1);
  });
});
