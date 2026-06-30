import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { doctorCommand, runDoctorChecks } from "../src/doctor.js";

describe("doctor CLI", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-cli-doctor-"));
    await writeFile(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "doctor-fixture", type: "module" }),
      "utf8",
    );
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns deterministic sorted checks", async () => {
    const checks = await runDoctorChecks({
      cwd: tmpDir,
      traceDir: path.join(tmpDir, ".agent-inspect"),
      checkImports: false,
    });
    expect(checks.map((check) => check.id)).toEqual([...checks.map((c) => c.id)].sort());
    expect(checks.some((check) => check.id === "node-version" && check.status === "pass")).toBe(
      true,
    );
    expect(checks.some((check) => check.id === "trace-dir-writable")).toBe(true);
  });

  it("prints JSON summary", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await doctorCommand({
      cwd: tmpDir,
      traceDir: path.join(tmpDir, ".agent-inspect"),
      checkImports: false,
      json: true,
    });
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.ok).toBe(true);
    expect(Array.isArray(payload.checks)).toBe(true);
    expect(payload.checks.every((check: { id: string }) => typeof check.id === "string")).toBe(
      true,
    );
  });

  it("warns when framework adapter package is missing", async () => {
    const checks = await runDoctorChecks({
      cwd: tmpDir,
      framework: "ai-sdk",
      checkImports: false,
    });
    expect(
      checks.find((check) => check.id === "optional-package-@agent-inspect/ai-sdk")?.status,
    ).toBe("warn");
  });
});
