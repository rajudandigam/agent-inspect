import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const coreDistDir = path.join(repoRoot, "packages", "core", "dist");
const cliDistDir = path.join(repoRoot, "packages", "cli", "dist");
const aiSdkDistDir = path.join(repoRoot, "packages", "ai-sdk", "dist");

const coreMjs = path.join(coreDistDir, "index.mjs");
const coreCjs = path.join(coreDistDir, "index.cjs");
const coreDts = path.join(coreDistDir, "index.d.ts");
const coreDcts = path.join(coreDistDir, "index.d.cts");
const cliCjs = path.join(cliDistDir, "index.cjs");
const aiSdkMjs = path.join(aiSdkDistDir, "index.mjs");
const aiSdkCjs = path.join(aiSdkDistDir, "index.cjs");
const aiSdkDts = path.join(aiSdkDistDir, "index.d.ts");
const aiSdkDcts = path.join(aiSdkDistDir, "index.d.cts");

const distPresent =
  existsSync(coreMjs) &&
  existsSync(coreCjs) &&
  existsSync(coreDts) &&
  existsSync(coreDcts) &&
  existsSync(cliCjs);

const aiSdkDistPresent =
  existsSync(aiSdkMjs) &&
  existsSync(aiSdkCjs) &&
  existsSync(aiSdkDts) &&
  existsSync(aiSdkDcts);

type DualExportEntry = {
  import?: { types?: string; default?: string };
  require?: { types?: string; default?: string };
};

describe("package manifest (root agent-inspect)", () => {
  it("has expected public package fields", () => {
    const raw = readFileSync(path.join(repoRoot, "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as Record<string, unknown>;

    expect(pkg.name).toBe("agent-inspect");
    expect(typeof pkg.main).toBe("string");
    expect(typeof pkg.module).toBe("string");
    expect(typeof pkg.types).toBe("string");

    const exportsField = pkg.exports as Record<string, DualExportEntry> | undefined;
    const rootExport = exportsField?.["."];
    expect(rootExport).toBeDefined();
    expect(rootExport?.import?.types).toContain("index.d.ts");
    expect(rootExport?.import?.default).toContain("index.mjs");
    expect(rootExport?.require?.types).toContain("index.d.cts");
    expect(rootExport?.require?.default).toContain("index.cjs");

    const bin = pkg.bin as Record<string, string> | undefined;
    expect(bin?.["agent-inspect"]).toBeDefined();

    const files = pkg.files as string[] | undefined;
    expect(files).toContain("packages/core/dist");
    expect(files).toContain("packages/cli/dist");

    expect(pkg.sideEffects).toBe(false);
    // Root ships to npm as the public `agent-inspect` package (not workspace-private).
    expect(pkg.private).not.toBe(true);
  });
});

describe("package manifest (internal workspace packages)", () => {
  it("keeps core and cli private (not published separately)", () => {
    const coreRaw = readFileSync(
      path.join(repoRoot, "packages", "core", "package.json"),
      "utf-8",
    );
    const cliRaw = readFileSync(
      path.join(repoRoot, "packages", "cli", "package.json"),
      "utf-8",
    );

    const corePkg = JSON.parse(coreRaw) as { name?: string; private?: boolean };
    const cliPkg = JSON.parse(cliRaw) as { name?: string; private?: boolean };

    expect(corePkg.name).toBe("@agent-inspect/core");
    expect(corePkg.private).toBe(true);
    expect(cliPkg.name).toBe("@agent-inspect/cli");
    expect(cliPkg.private).toBe(true);
  });
});

describe("package manifest (experimental AI SDK adapter)", () => {
  it("keeps the optional package private until release readiness", () => {
    const raw = readFileSync(
      path.join(repoRoot, "packages", "ai-sdk", "package.json"),
      "utf-8",
    );
    const pkg = JSON.parse(raw) as Record<string, unknown>;

    expect(pkg.name).toBe("@agent-inspect/ai-sdk");
    expect(pkg.private).toBe(true);
    expect(pkg.sideEffects).toBe(false);

    const exportsField = pkg.exports as Record<string, DualExportEntry> | undefined;
    const rootExport = exportsField?.["."];
    expect(rootExport).toBeDefined();
    expect(rootExport?.import?.types).toContain("index.d.ts");
    expect(rootExport?.import?.default).toContain("index.mjs");
    expect(rootExport?.require?.types).toContain("index.d.cts");
    expect(rootExport?.require?.default).toContain("index.cjs");

    const peerDependencies = pkg.peerDependencies as Record<string, string> | undefined;
    expect(peerDependencies?.ai).toBe("^6.0.0");

    const dependencies = pkg.dependencies as Record<string, string> | undefined;
    expect(dependencies?.["agent-inspect"]).toBe("workspace:*");
  });
});

describe("package dist outputs", () => {
  it.skipIf(!distPresent)(
    "built core and CLI artifacts exist (run pnpm build first)",
    () => {
      expect(existsSync(coreMjs)).toBe(true);
      expect(existsSync(coreCjs)).toBe(true);
      expect(existsSync(coreDts)).toBe(true);
      expect(existsSync(coreDcts)).toBe(true);
      expect(existsSync(cliCjs)).toBe(true);
    },
  );

  it.skipIf(!aiSdkDistPresent)(
    "built AI SDK adapter artifacts exist (run pnpm build first)",
    () => {
      expect(existsSync(aiSdkMjs)).toBe(true);
      expect(existsSync(aiSdkCjs)).toBe(true);
      expect(existsSync(aiSdkDts)).toBe(true);
      expect(existsSync(aiSdkDcts)).toBe(true);
    },
  );
});
