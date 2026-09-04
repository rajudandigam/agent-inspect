import { createRequire } from "node:module";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { withNpmInstallLock } from "./helpers/npm-install-lock.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const snapshotPath = path.join(
  testDir,
  "fixtures/api-surface.snapshot.json",
);
const tscBin = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");
const coreDist = path.join(repoRoot, "packages/core/dist");
const distPresent =
  existsSync(path.join(coreDist, "index.mjs")) &&
  existsSync(path.join(coreDist, "index.cjs"));

type ApiSurfaceModule = {
  buildApiSurfaceSnapshot: (
    repoRoot: string,
  ) => Promise<Record<string, unknown>>;
  stableStringify: (value: unknown) => string;
};

async function loadApiSurface(): Promise<ApiSurfaceModule> {
  return (await import(
    pathToFileURL(path.join(repoRoot, "scripts/lib/api-surface.mjs")).href
  )) as ApiSurfaceModule;
}

describe.skipIf(!distPresent)("published API surface snapshot (#211)", () => {
  it("locks package exports, bins, and root/subpath runtime names", async () => {
    const { buildApiSurfaceSnapshot, stableStringify } = await loadApiSurface();
    const expected = JSON.parse(readFileSync(snapshotPath, "utf8")) as unknown;
    const actual = await buildApiSurfaceSnapshot(repoRoot);

    if (process.env.UPDATE_API_SURFACE_SNAPSHOT === "1") {
      writeFileSync(snapshotPath, stableStringify(actual));
    }

    expect(actual.rootEsm).toEqual(actual.rootCjs);
    expect(stableStringify(actual)).toBe(stableStringify(expected));
  });

  it.skipIf(!existsSync(tscBin))(
    "typechecks public root contract types from a consumer fixture",
    () => {
      const projectDir = mkdtempSync(
        path.join(tmpdir(), "agent-inspect-api-surface-types-"),
      );
      try {
        writeFileSync(
          path.join(projectDir, "package.json"),
          `${JSON.stringify({ name: "api-surface-types", private: true, type: "module" }, null, 2)}\n`,
        );
        writeFileSync(
          path.join(projectDir, "tsconfig.json"),
          `${JSON.stringify(
            {
              compilerOptions: {
                strict: true,
                module: "Node16",
                moduleResolution: "Node16",
                target: "ES2022",
                noEmit: true,
                skipLibCheck: true,
                types: [],
              },
              include: ["consumer.ts"],
            },
            null,
            2,
          )}\n`,
        );
        writeFileSync(
          path.join(projectDir, "consumer.ts"),
          [
            "import type {",
            "  CreateInspectorOptions,",
            "  InspectRunOptions,",
            "  RedactionProfile,",
            "  RunStatus,",
            "  StepStatus,",
            "  StepType,",
            "  TraceCorrelationMetadata,",
            '} from "agent-inspect";',
            "",
            'const stepType: StepType = "llm";',
            'const stepStatus: StepStatus = "success";',
            'const runStatus: RunStatus = "success";',
            'const redaction: RedactionProfile = "strict";',
            "const inspectOptions: InspectRunOptions = { silent: true };",
            "const createOptions: CreateInspectorOptions = { silent: true };",
            'const correlation: TraceCorrelationMetadata = { correlationId: "corr_fixture" };',
            "void [stepType, stepStatus, runStatus, redaction, inspectOptions, createOptions, correlation];",
            "",
          ].join("\n"),
        );

        const install = withNpmInstallLock(() =>
          spawnSync(
            "npm",
            [
              "install",
              "--no-save",
              "--ignore-scripts",
              "--no-audit",
              "--no-fund",
              repoRoot,
            ],
            {
              cwd: projectDir,
              encoding: "utf8",
              shell: process.platform === "win32",
            },
          ),
        );
        expect(install.status, install.stdout + install.stderr).toBe(0);

        const result = spawnSync(
          process.execPath,
          [tscBin, "-p", path.join(projectDir, "tsconfig.json")],
          { cwd: projectDir, encoding: "utf8" },
        );
        expect(result.status, result.stdout + result.stderr).toBe(0);
      } finally {
        rmSync(projectDir, { recursive: true, force: true });
      }
    },
  );

  it("loads packed-equivalent CJS/ESM roots with matching export names", async () => {
    const require = createRequire(path.join(repoRoot, "package.json"));
    const cjs = require(path.join(coreDist, "index.cjs")) as Record<
      string,
      unknown
    >;
    const esm = (await import(
      pathToFileURL(path.join(coreDist, "index.mjs")).href
    )) as Record<string, unknown>;
    const cjsNames = Object.keys(cjs)
      .filter((k) => k !== "default" && k !== "module.exports")
      .sort();
    const esmNames = Object.keys(esm)
      .filter((k) => k !== "default")
      .sort();
    expect(esmNames).toEqual(cjsNames);

    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as {
      rootEsm: string[];
    };
    expect(esmNames).toEqual(snapshot.rootEsm);
  });
});
