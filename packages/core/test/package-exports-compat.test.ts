import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const tscBin = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");

const coreDistDir = path.join(repoRoot, "packages", "core", "dist");
const distPresent =
  existsSync(path.join(coreDistDir, "index.mjs")) &&
  existsSync(path.join(coreDistDir, "index.cjs")) &&
  existsSync(path.join(coreDistDir, "index.d.ts")) &&
  existsSync(path.join(coreDistDir, "index.d.cts"));

type DualExportEntry = {
  import?: { types?: string; default?: string };
  require?: { types?: string; default?: string };
};

function readPkgExports(
  rel: string,
): { name: string; exports: Record<string, DualExportEntry> } {
  const raw = readFileSync(path.join(repoRoot, rel), "utf-8");
  const pkg = JSON.parse(raw) as {
    name?: string;
    exports?: Record<string, DualExportEntry>;
  };
  return { name: pkg.name ?? rel, exports: pkg.exports ?? {} };
}

function expectDualConditionalExport(entry: DualExportEntry | undefined, label: string) {
  expect(entry, `${label}: exports["."]`).toBeDefined();
  expect(entry?.import?.types, `${label}: import.types`).toMatch(/index\.d\.ts$/);
  expect(entry?.import?.default, `${label}: import.default`).toMatch(/index\.mjs$/);
  expect(entry?.require?.types, `${label}: require.types`).toMatch(/index\.d\.cts$/);
  expect(entry?.require?.default, `${label}: require.default`).toMatch(/index\.cjs$/);
}

function runTsc(projectDir: string): void {
  const result = spawnSync(process.execPath, [tscBin, "-p", path.join(projectDir, "tsconfig.json")], {
    cwd: projectDir,
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    throw new Error(
      `tsc failed in ${projectDir}:\n${result.stdout}\n${result.stderr}`,
    );
  }
}

function installAgentInspect(consumerDir: string): void {
  execSync(`npm install "${repoRoot}"`, {
    cwd: consumerDir,
    stdio: "pipe",
    encoding: "utf-8",
  });
}

describe("package conditional type exports (manifest)", () => {
  it("root agent-inspect exposes import/require conditional types", () => {
    const { exports } = readPkgExports("package.json");
    expectDualConditionalExport(exports["."], "agent-inspect");
  });

  it("root agent-inspect exposes public subpath conditional types", () => {
    const { exports } = readPkgExports("package.json");
    for (const subpath of [
      "advanced",
      "persisted",
      "logs",
      "exporters",
      "diff",
      "writers",
      "readers",
      "checks",
      "reporters",
    ]) {
      const entry = exports[`./${subpath}`];
      expect(entry, `exports["./${subpath}"]`).toBeDefined();
      expect(entry?.import?.types, `${subpath} import.types`).toMatch(
        new RegExp(`/${subpath}\\.d\\.ts$`),
      );
      expect(entry?.import?.default, `${subpath} import.default`).toMatch(
        new RegExp(`/${subpath}\\.mjs$`),
      );
      expect(entry?.require?.types, `${subpath} require.types`).toMatch(
        new RegExp(`/${subpath}\\.d\\.cts$`),
      );
      expect(entry?.require?.default, `${subpath} require.default`).toMatch(
        new RegExp(`/${subpath}\\.cjs$`),
      );
    }
  });

  it("@agent-inspect/core exposes import/require conditional types", () => {
    const { exports } = readPkgExports("packages/core/package.json");
    expectDualConditionalExport(exports["."], "@agent-inspect/core");
  });

  it("@agent-inspect/langchain exposes import/require conditional types", () => {
    const { exports } = readPkgExports("packages/langchain/package.json");
    expectDualConditionalExport(exports["."], "@agent-inspect/langchain");
  });

  it("@agent-inspect/tui exposes import/require conditional types", () => {
    const { exports } = readPkgExports("packages/tui/package.json");
    expectDualConditionalExport(exports["."], "@agent-inspect/tui");
  });

  it("@agent-inspect/vitest exposes import/require conditional types", () => {
    const { exports } = readPkgExports("packages/vitest/package.json");
    expectDualConditionalExport(exports["."], "@agent-inspect/vitest");
  });

  it("@agent-inspect/jest exposes import/require conditional types", () => {
    const { exports } = readPkgExports("packages/jest/package.json");
    expectDualConditionalExport(exports["."], "@agent-inspect/jest");
  });

  it("root package exposes agent-inspect CLI bin", () => {
    const raw = readFileSync(path.join(repoRoot, "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as { bin?: Record<string, string> };
    expect(pkg.bin?.["agent-inspect"]).toContain("packages/cli/dist/index.cjs");
  });
});

describe.skipIf(!distPresent)("consumer TypeScript resolution (installed tarball layout)", () => {
  const tmpRoots: string[] = [];

  afterAll(() => {
    for (const dir of tmpRoots) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function makeConsumer(
    name: string,
    pkg: Record<string, unknown>,
    tsconfig: Record<string, unknown>,
    entryFile: string,
    entryContents: string,
  ): string {
    const dir = mkdtempSync(path.join(tmpdir(), `agent-inspect-${name}-`));
    tmpRoots.push(dir);
    writeFileSync(path.join(dir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
    writeFileSync(path.join(dir, "tsconfig.json"), `${JSON.stringify(tsconfig, null, 2)}\n`);
    writeFileSync(path.join(dir, entryFile), entryContents);
    installAgentInspect(dir);
    return dir;
  }

  it("ESM TypeScript consumer compiles with module NodeNext", () => {
    const dir = makeConsumer(
      "esm-ts",
      { name: "esm-consumer", private: true, type: "module" },
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
        },
        include: ["index.ts"],
      },
      "index.ts",
      `import { inspectRun, step, observe } from "agent-inspect";
import type { InspectRunOptions } from "agent-inspect";
import type { TraceEvent } from "agent-inspect/advanced";

const opts: InspectRunOptions = { silent: true };
const _witness: TraceEvent | undefined = undefined;
void opts;
void _witness;

export async function smoke(): Promise<unknown> {
  return inspectRun("esm-ts-smoke", async () => {
    await step("ok", async () => 1);
    return observe({ async run() { return 2; } }).run();
  }, { silent: true });
}
`,
    );
    runTsc(dir);
  });

  it("CJS TypeScript consumer compiles with module Node16 (.cts)", () => {
    const dir = makeConsumer(
      "cjs-ts",
      { name: "cjs-consumer", private: true, type: "commonjs" },
      {
        compilerOptions: {
          module: "Node16",
          moduleResolution: "Node16",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
        },
        include: ["index.cts"],
      },
      "index.cts",
      `import { inspectRun, step } from "agent-inspect";
import type { StepOptions } from "agent-inspect";

const stepOpts: StepOptions = { type: "logic" };
void stepOpts;

export async function smoke(): Promise<number> {
  return inspectRun("cjs-ts-smoke", async () => {
    return step("ok", async () => 1, stepOpts);
  }, { silent: true });
}
`,
    );
    runTsc(dir);
  });

  it("runtime ESM import works after install", () => {
    const dir = makeConsumer(
      "esm-rt",
      { name: "esm-runtime", private: true, type: "module" },
      { compilerOptions: { module: "NodeNext", noEmit: true }, include: [] },
      "noop.ts",
      "",
    );
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        "import('agent-inspect').then(m => { if (typeof m.inspectRun !== 'function') process.exit(1); })",
      ],
      { cwd: dir, encoding: "utf-8" },
    );
    expect(result.status).toBe(0);
  });

  it("runtime CJS require works after install", () => {
    const dir = makeConsumer(
      "cjs-rt",
      { name: "cjs-runtime", private: true, type: "commonjs" },
      { compilerOptions: { module: "Node16", noEmit: true }, include: [] },
      "noop.cts",
      "",
    );
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        "const m = require('agent-inspect'); if (typeof m.inspectRun !== 'function') process.exit(1);",
      ],
      { cwd: dir, encoding: "utf-8" },
    );
    expect(result.status).toBe(0);
  });
});
