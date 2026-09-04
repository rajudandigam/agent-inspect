import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildPackageManifestIndex,
  listUngovernedPackages,
  listVisibleNonFixedPackages,
  resolveFixedGroupReadmes,
} from "./package-readme-coverage.mjs";

const fixtures = [];

afterEach(() => {
  for (const fixture of fixtures.splice(0))
    rmSync(fixture, { recursive: true, force: true });
});

function write(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function createFixture({
  includeRootReadme = true,
  includeFooManifest = true,
  includeFooReadme = true,
  duplicateFoo = false,
} = {}) {
  const root = mkdtempSync(
    path.join(tmpdir(), "agent-inspect-package-readmes-"),
  );
  fixtures.push(root);

  write(root, "package.json", JSON.stringify({ name: "agent-inspect" }));
  if (includeRootReadme) write(root, "README.md", "root\n");
  if (includeFooManifest) {
    write(
      root,
      "packages/foo/package.json",
      JSON.stringify({ name: "@agent-inspect/foo" }),
    );
  }
  if (includeFooReadme) write(root, "packages/foo/README.md", "foo\n");
  if (duplicateFoo) {
    write(
      root,
      "packages/foo-copy/package.json",
      JSON.stringify({ name: "@agent-inspect/foo" }),
    );
    write(root, "packages/foo-copy/README.md", "foo copy\n");
  }
  write(
    root,
    "packages/vscode/package.json",
    JSON.stringify({ name: "agent-inspect-vscode" }),
  );
  write(root, "packages/vscode/README.md", "vscode\n");

  return root;
}

function resolve(root) {
  const fixedGroup = new Set(["agent-inspect", "@agent-inspect/foo"]);
  const manifestIndex = buildPackageManifestIndex(root);
  return {
    fixedGroup,
    manifestIndex,
    result: resolveFixedGroupReadmes({
      repositoryRoot: root,
      fixedGroup,
      manifestIndex,
    }),
  };
}

describe("fixed-group package README coverage", () => {
  it("resolves root and scoped members by package identity", () => {
    const { fixedGroup, manifestIndex, result } = resolve(createFixture());

    expect(result.failures).toEqual([]);
    expect(result.readmes.map(({ name }) => name)).toEqual([
      "agent-inspect",
      "@agent-inspect/foo",
    ]);
    expect(listVisibleNonFixedPackages({ fixedGroup, manifestIndex })).toEqual([
      "agent-inspect-vscode",
    ]);
  });

  it("fails closed when the root README is missing", () => {
    const { result } = resolve(createFixture({ includeRootReadme: false }));

    expect(result.failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining("agent-inspect: README.md was not found"),
        expect.stringContaining("coverage mismatch: missing agent-inspect"),
      ]),
    );
  });

  it("fails closed when a scoped fixed-member README is missing", () => {
    const { result } = resolve(createFixture({ includeFooReadme: false }));

    expect(result.failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "@agent-inspect/foo: packages/foo/README.md was not found",
        ),
        expect.stringContaining(
          "coverage mismatch: missing @agent-inspect/foo",
        ),
      ]),
    );
  });

  it("names a fixed member whose manifest cannot be resolved", () => {
    const { result } = resolve(
      createFixture({ includeFooManifest: false, includeFooReadme: false }),
    );

    expect(result.failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "@agent-inspect/foo: no repository package.json declares",
        ),
        expect.stringContaining(
          "coverage mismatch: missing @agent-inspect/foo",
        ),
      ]),
    );
  });

  it("rejects duplicate fixed-member package identities", () => {
    const { result } = resolve(createFixture({ duplicateFoo: true }));

    expect(result.failures.join("\n")).toContain(
      "Duplicate package identity: @agent-inspect/foo",
    );
    expect(result.failures.join("\n")).toContain("packages/foo/package.json");
    expect(result.failures.join("\n")).toContain(
      "packages/foo-copy/package.json",
    );
  });

  it("keeps resolved but canonically ungoverned packages non-fatal", () => {
    const { result } = resolve(createFixture());
    const matrixLevels = new Map([["agent-inspect", { level: "Stable" }]]);

    expect(result.failures).toEqual([]);
    expect(
      listUngovernedPackages({ readmes: result.readmes, matrixLevels }),
    ).toEqual(["@agent-inspect/foo"]);
  });
});
