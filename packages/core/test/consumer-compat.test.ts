import { execSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const fixturesRoot = path.join(repoRoot, "test", "consumer-fixtures");
const tscBin = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");

const coreDistDir = path.join(repoRoot, "packages", "core", "dist");
const distPresent =
  existsSync(path.join(coreDistDir, "index.mjs")) &&
  existsSync(path.join(coreDistDir, "index.cjs"));

const tmpRoots: string[] = [];

afterAll(() => {
  for (const dir of tmpRoots) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function installFixture(fixtureName: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), `agent-inspect-${fixtureName}-`));
  tmpRoots.push(dir);
  cpSync(path.join(fixturesRoot, fixtureName), dir, { recursive: true });
  execSync(`npm install "${repoRoot}"`, {
    cwd: dir,
    stdio: "pipe",
    encoding: "utf-8",
  });
  return dir;
}

describe.skipIf(!distPresent)("consumer compatibility fixtures", () => {
  it("core CJS bundle does not require chalk or nanoid at runtime", () => {
    const src = readFileSync(path.join(coreDistDir, "index.cjs"), "utf-8");
    expect(src).not.toMatch(/require\(["']chalk["']\)/);
    expect(src).not.toMatch(/require\(["']nanoid["']\)/);
  });

  it("esm-node fixture imports inspectRun, step, maybeInspectRun", () => {
    const dir = installFixture("esm-node");
    const result = spawnSync(process.execPath, ["smoke.mjs"], {
      cwd: dir,
      encoding: "utf-8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("esm-node:ok");
  });

  it("cjs-node fixture requires inspectRun, step, maybeInspectRun", () => {
    const dir = installFixture("cjs-node");
    const result = spawnSync(process.execPath, ["smoke.cjs"], {
      cwd: dir,
      encoding: "utf-8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("cjs-node:ok");
  });

  it("jest-cjs fixture: maybeInspectRun enabled=false writes no trace", () => {
    const dir = installFixture("jest-cjs");
    const result = spawnSync(process.execPath, ["smoke.test.cjs"], {
      cwd: dir,
      encoding: "utf-8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("jest-cjs:ok");
  });

  it("ts-jest-node16 fixture compiles and runs with Node16 module mode", () => {
    const dir = installFixture("ts-jest-node16");
    const result = spawnSync(process.execPath, ["run-smoke.cjs"], {
      cwd: dir,
      encoding: "utf-8",
      env: { ...process.env, AGENT_INSPECT_TSC_BIN: tscBin },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("ts-jest-node16:ok");
  });
});
