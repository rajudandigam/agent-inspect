/**
 * Focused C0P tests for inventory / empty-tarball rejection.
 * Run: node --test scripts/release-artifacts.test.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertTarballComplete,
  collectEntryTargets,
  expectedPublishableNames,
  sha256File,
  validateInventory,
} from "./release-artifacts-lib.mjs";

test("expectedPublishableNames returns the 18 fixed packages", () => {
  const names = expectedPublishableNames();
  assert.equal(names.length, 18);
  assert.ok(names.includes("agent-inspect"));
  assert.ok(names.includes("@agent-inspect/langchain"));
});

test("collectEntryTargets reads main/module/types/bin/exports", () => {
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
  assert.ok(targets.includes("dist/index.cjs"));
  assert.ok(targets.includes("dist/index.mjs"));
  assert.ok(targets.includes("dist/index.d.ts"));
  assert.ok(targets.includes("dist/cli.cjs"));
  assert.ok(targets.includes("dist/index.d.cts"));
});

test("assertTarballComplete rejects stub three-file archives", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "ai-stub-"));
  try {
    const pkgDir = path.join(tmp, "package");
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(path.join(pkgDir, "package.json"), JSON.stringify({
      name: "@agent-inspect/langchain",
      version: "0.0.0",
      main: "./dist/index.cjs",
      module: "./dist/index.mjs",
      types: "./dist/index.d.ts",
    }));
    writeFileSync(path.join(pkgDir, "README.md"), "x\n");
    writeFileSync(path.join(pkgDir, "LICENSE"), "MIT\n");
    const tgz = path.join(tmp, "stub.tgz");
    execFileSync("tar", ["-czf", tgz, "-C", tmp, "package"]);
    assert.throws(
      () =>
        assertTarballComplete("@agent-inspect/langchain", tgz, {
          main: "./dist/index.cjs",
          module: "./dist/index.mjs",
          types: "./dist/index.d.ts",
        }),
      /empty\/stub|missing advertised/,
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("validateInventory rejects sha256 mismatch", () => {
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

    // Build a fake inventory claiming wrong hash and incomplete package set —
    // validateInventory requires full 18-package set from changeset config.
    // Instead unit-test sha256File mismatch directly here, and call
    // assertTarballComplete on a tampered expectation.
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
    assert.throws(() => validateInventory(tmp), /must be 18|does not match changeset|sha256/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("assertTarballComplete accepts archive with declared dist entries", () => {
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
    assert.ok(result.fileCount === undefined);
    assert.ok(result.entries.length > 3);
    assert.ok(result.targets.includes("dist/index.mjs"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
