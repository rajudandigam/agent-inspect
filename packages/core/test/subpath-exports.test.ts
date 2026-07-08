import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const coreDistDir = path.join(repoRoot, "packages", "core", "dist");

const SUBPATHS = [
  "advanced",
  "persisted",
  "logs",
  "exporters",
  "diff",
  "writers",
  "readers",
  "checks",
  "reporters",
  "workspace",
] as const;

type DualExportEntry = {
  import?: { types?: string; default?: string };
  require?: { types?: string; default?: string };
};

function readRootExports(): Record<string, DualExportEntry> {
  const raw = readFileSync(path.join(repoRoot, "package.json"), "utf-8");
  const pkg = JSON.parse(raw) as { exports?: Record<string, DualExportEntry> };
  return pkg.exports ?? {};
}

function expectSubpathExport(
  exports: Record<string, DualExportEntry>,
  subpath: string,
  baseName: string,
) {
  const key = `./${subpath}`;
  const entry = exports[key];
  expect(entry, `exports["${key}"]`).toBeDefined();
  expect(entry?.import?.types, `${key} import.types`).toMatch(
    new RegExp(`/${baseName}\\.d\\.ts$`),
  );
  expect(entry?.import?.default, `${key} import.default`).toMatch(
    new RegExp(`/${baseName}\\.mjs$`),
  );
  expect(entry?.require?.types, `${key} require.types`).toMatch(
    new RegExp(`/${baseName}\\.d\\.cts$`),
  );
  expect(entry?.require?.default, `${key} require.default`).toMatch(
    new RegExp(`/${baseName}\\.cjs$`),
  );
}

const distPresent = SUBPATHS.every((name) =>
  existsSync(path.join(coreDistDir, `${name}.mjs`)),
);

describe("subpath exports manifest", () => {
  it("root package.json declares all public subpaths", () => {
    const exports = readRootExports();
    for (const subpath of SUBPATHS) {
      expectSubpathExport(exports, subpath, subpath);
    }
  });
});

describe.skipIf(!distPresent)("subpath dist artifacts", () => {
  it("each subpath has ESM, CJS, and dual type declarations", () => {
    for (const name of SUBPATHS) {
      expect(existsSync(path.join(coreDistDir, `${name}.mjs`))).toBe(true);
      expect(existsSync(path.join(coreDistDir, `${name}.cjs`))).toBe(true);
      expect(existsSync(path.join(coreDistDir, `${name}.d.ts`))).toBe(true);
      expect(existsSync(path.join(coreDistDir, `${name}.d.cts`))).toBe(true);
    }
  });
});
