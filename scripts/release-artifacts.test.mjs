/**
 * Focused C0P tests for inventory / empty-tarball rejection.
 * Picked up by root vitest (scripts/*.test.mjs include).
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertTarballComplete,
  collectEntryTargets,
  expectedPublishableNames,
  sha256File,
  validateInventory,
} from "./release-artifacts-lib.mjs";

describe("release-artifacts", () => {
  it("expectedPublishableNames returns the 18 fixed packages", () => {
    const names = expectedPublishableNames();
    expect(names).toHaveLength(18);
    expect(names).toContain("agent-inspect");
    expect(names).toContain("@agent-inspect/langchain");
  });

  it("collectEntryTargets reads main/module/types/bin/exports", () => {
    const targets = collectEntryTargets({
      main: "./dist/index.cjs",
      module: "./dist/index.mjs",
      types: "./dist/index.d.ts",
      bin: { "agent-inspect": "./dist/cli.cjs" },
      exports: {
        ".": {
          import: { types: "./dist/index.d.ts", default: "./dist/index.mjs" },
          require: { types: "./dist/index.d.cts", default: "./dist/index.cjs" },
        },
      },
    });
    expect(targets).toEqual(
      expect.arrayContaining([
        "dist/index.cjs",
        "dist/index.mjs",
        "dist/index.d.ts",
        "dist/cli.cjs",
        "dist/index.d.cts",
      ]),
    );
  });

  it("assertTarballComplete rejects stub three-file archives", () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), "ai-stub-"));
    try {
      const pkgDir = path.join(tmp, "package");
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        path.join(pkgDir, "package.json"),
        JSON.stringify({
          name: "@agent-inspect/langchain",
          version: "0.0.0",
          main: "./dist/index.cjs",
          module: "./dist/index.mjs",
          types: "./dist/index.d.ts",
        }),
      );
      writeFileSync(path.join(pkgDir, "README.md"), "x\n");
      writeFileSync(path.join(pkgDir, "LICENSE"), "MIT\n");
      const tgz = path.join(tmp, "stub.tgz");
      execFileSync("tar", ["-czf", tgz, "-C", tmp, "package"]);
      expect(() =>
        assertTarballComplete("@agent-inspect/langchain", tgz, {
          main: "./dist/index.cjs",
          module: "./dist/index.mjs",
          types: "./dist/index.d.ts",
        }),
      ).toThrow(/empty\/stub|missing advertised/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("validateInventory rejects sha256 mismatch / incomplete set", () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), "ai-inv-"));
    try {
      const pkgDir = path.join(tmp, "package");
      mkdirSync(path.join(pkgDir, "dist"), { recursive: true });
      writeFileSync(
        path.join(pkgDir, "package.json"),
        JSON.stringify({
          name: "agent-inspect",
          version: "9.9.9",
          main: "./dist/index.cjs",
          module: "./dist/index.mjs",
          types: "./dist/index.d.ts",
        }),
      );
      writeFileSync(path.join(pkgDir, "README.md"), "readme\n");
      writeFileSync(path.join(pkgDir, "LICENSE"), "MIT\n");
      writeFileSync(path.join(pkgDir, "dist", "index.cjs"), "module.exports = {};\n");
      writeFileSync(path.join(pkgDir, "dist", "index.mjs"), "export {};\n");
      writeFileSync(path.join(pkgDir, "dist", "index.d.ts"), "export {};\n");
      const tgz = path.join(tmp, "agent-inspect-9.9.9.tgz");
      execFileSync("tar", ["-czf", tgz, "-C", tmp, "package"]);

      const real = sha256File(tgz);
      const wrong = createHash("sha256").update("nope").digest("hex");
      assert.notEqual(real, wrong);
      writeFileSync(
        path.join(tmp, "inventory.json"),
        JSON.stringify({
          schemaVersion: 1,
          sourceSha: "abc",
          expectedVersion: "9.9.9",
          packageCount: 1,
          expectedNames: ["agent-inspect"],
          packages: [
            {
              name: "agent-inspect",
              version: "9.9.9",
              tarball: path.basename(tgz),
              sha256: wrong,
              fileCount: 6,
              entryTargets: ["dist/index.cjs"],
            },
          ],
        }),
      );
      expect(() => validateInventory(tmp)).toThrow(
        /must be 18|does not match changeset|sha256/,
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("assertTarballComplete accepts archive with declared dist entries", () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), "ai-ok-"));
    try {
      const pkgDir = path.join(tmp, "package");
      mkdirSync(path.join(pkgDir, "dist"), { recursive: true });
      const manifest = {
        name: "@agent-inspect/redact",
        version: "0.0.0",
        main: "./dist/index.cjs",
        module: "./dist/index.mjs",
        types: "./dist/index.d.ts",
        exports: {
          ".": {
            import: { types: "./dist/index.d.ts", default: "./dist/index.mjs" },
            require: { types: "./dist/index.d.cts", default: "./dist/index.cjs" },
          },
        },
      };
      writeFileSync(path.join(pkgDir, "package.json"), JSON.stringify(manifest));
      writeFileSync(path.join(pkgDir, "README.md"), "r\n");
      writeFileSync(path.join(pkgDir, "LICENSE"), "MIT\n");
      writeFileSync(path.join(pkgDir, "dist", "index.cjs"), "module.exports = {};\n");
      writeFileSync(path.join(pkgDir, "dist", "index.mjs"), "export {};\n");
      writeFileSync(path.join(pkgDir, "dist", "index.d.ts"), "export {};\n");
      writeFileSync(path.join(pkgDir, "dist", "index.d.cts"), "export {};\n");
      const tgz = path.join(tmp, "ok.tgz");
      execFileSync("tar", ["-czf", tgz, "-C", tmp, "package"]);
      const result = assertTarballComplete("@agent-inspect/redact", tgz, manifest);
      expect(result.entries.length).toBeGreaterThan(3);
      expect(result.targets).toContain("dist/index.mjs");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
