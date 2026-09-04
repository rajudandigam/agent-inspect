import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AGENT_INSPECT_NOT_RESOLVABLE_MESSAGE,
  AGENT_INSPECT_NOT_RESOLVABLE_REMEDIATION,
  DOCS_BASE,
  doctorCommand,
  resolveInstalledPackage,
  runDoctorChecks,
} from "../src/doctor.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const coreDistPresent = existsSync(path.join(repoRoot, "packages/core/dist/index.cjs"));

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

  it("gives an actionable, doc-linked not-resolvable remediation for packed consumers", () => {
    // Clarifies the common packed-consumer mistake (a global CLI install is not enough).
    expect(AGENT_INSPECT_NOT_RESOLVABLE_MESSAGE).toMatch(/global CLI install is not enough/i);
    expect(AGENT_INSPECT_NOT_RESOLVABLE_REMEDIATION).toContain("npm install agent-inspect");
    expect(AGENT_INSPECT_NOT_RESOLVABLE_REMEDIATION).toContain(`${DOCS_BASE}/`);
    expect(DOCS_BASE).toMatch(/^https:\/\/github\.com\/rajudandigam\/agent-inspect\/blob\/main\/docs$/);
  });

  it("treats unresolved package names as not installed", () => {
    // Avoid Vitest workspace aliases (they map real @agent-inspect/* package ids).
    expect(resolveInstalledPackage(tmpDir, "@agent-inspect/not-a-real-package-zzz").ok).toBe(
      false,
    );
  });

  it.runIf(coreDistPresent)(
    "resolves installed packages via entry when package.json is not exported",
    async () => {
      const checks = await runDoctorChecks({
        cwd: repoRoot,
        checkImports: true,
        framework: "custom",
      });
      expect(checks.find((check) => check.id === "import-agent-inspect")?.status).toBe("pass");
      expect(checks.find((check) => check.id === "import-agent-inspect-cjs")?.status).toBe("pass");
      expect(checks.find((check) => check.id === "version-alignment")?.status).toBe("pass");
      const resolved = resolveInstalledPackage(repoRoot, "agent-inspect");
      expect(resolved.ok).toBe(true);
      expect(resolved.version).toMatch(/^\d+\.\d+\.\d+/);
    },
  );
});
