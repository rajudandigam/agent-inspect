import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const coreDistDir = path.join(repoRoot, "packages", "core", "dist");
const cliDistDir = path.join(repoRoot, "packages", "cli", "dist");
const aiSdkDistDir = path.join(repoRoot, "packages", "ai-sdk", "dist");
const vitestDistDir = path.join(repoRoot, "packages", "vitest", "dist");
const openAiAgentsDistDir = path.join(repoRoot, "packages", "openai-agents", "dist");

const coreMjs = path.join(coreDistDir, "index.mjs");
const coreCjs = path.join(coreDistDir, "index.cjs");
const coreDts = path.join(coreDistDir, "index.d.ts");
const coreDcts = path.join(coreDistDir, "index.d.cts");
const cliCjs = path.join(cliDistDir, "index.cjs");
const aiSdkMjs = path.join(aiSdkDistDir, "index.mjs");
const aiSdkCjs = path.join(aiSdkDistDir, "index.cjs");
const aiSdkDts = path.join(aiSdkDistDir, "index.d.ts");
const aiSdkDcts = path.join(aiSdkDistDir, "index.d.cts");
const vitestMjs = path.join(vitestDistDir, "index.mjs");
const vitestCjs = path.join(vitestDistDir, "index.cjs");
const vitestDts = path.join(vitestDistDir, "index.d.ts");
const vitestDcts = path.join(vitestDistDir, "index.d.cts");
const openAiAgentsMjs = path.join(openAiAgentsDistDir, "index.mjs");
const openAiAgentsCjs = path.join(openAiAgentsDistDir, "index.cjs");
const openAiAgentsDts = path.join(openAiAgentsDistDir, "index.d.ts");
const openAiAgentsDcts = path.join(openAiAgentsDistDir, "index.d.cts");

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

const vitestDistPresent =
  existsSync(vitestMjs) &&
  existsSync(vitestCjs) &&
  existsSync(vitestDts) &&
  existsSync(vitestDcts);

const openAiAgentsDistPresent =
  existsSync(openAiAgentsMjs) &&
  existsSync(openAiAgentsCjs) &&
  existsSync(openAiAgentsDts) &&
  existsSync(openAiAgentsDcts);

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
  it("keeps the optional package publishable and dependency-isolated", () => {
    const raw = readFileSync(
      path.join(repoRoot, "packages", "ai-sdk", "package.json"),
      "utf-8",
    );
    const pkg = JSON.parse(raw) as Record<string, unknown>;

    expect(pkg.name).toBe("@agent-inspect/ai-sdk");
    expect(pkg.private).toBeUndefined();
    expect(pkg.sideEffects).toBe(false);
    expect(pkg.publishConfig).toEqual({ access: "public" });

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

describe("package manifest (experimental Vitest reporter)", () => {
  it("keeps the optional package private and dependency-isolated until release readiness", () => {
    const raw = readFileSync(
      path.join(repoRoot, "packages", "vitest", "package.json"),
      "utf-8",
    );
    const pkg = JSON.parse(raw) as Record<string, unknown>;

    expect(pkg.name).toBe("@agent-inspect/vitest");
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
    expect(peerDependencies?.vitest).toBe("^2.1.0");

    const dependencies = pkg.dependencies as Record<string, string> | undefined;
    expect(dependencies?.["agent-inspect"]).toBe("workspace:*");
    expect(dependencies?.vitest).toBeUndefined();
  });
});

describe("package manifest (experimental OpenAI Agents adapter)", () => {
  it("keeps the optional package private and dependency-isolated until release readiness", () => {
    const raw = readFileSync(
      path.join(repoRoot, "packages", "openai-agents", "package.json"),
      "utf-8",
    );
    const pkg = JSON.parse(raw) as Record<string, unknown>;

    expect(pkg.name).toBe("@agent-inspect/openai-agents");
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
    expect(peerDependencies?.["@openai/agents"]).toBe("^0.12.0");

    const dependencies = pkg.dependencies as Record<string, string> | undefined;
    expect(dependencies?.["agent-inspect"]).toBe("workspace:*");
    expect(dependencies?.["@openai/agents"]).toBeUndefined();
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

  it.skipIf(!vitestDistPresent)(
    "built Vitest reporter artifacts exist (run pnpm build first)",
    () => {
      expect(existsSync(vitestMjs)).toBe(true);
      expect(existsSync(vitestCjs)).toBe(true);
      expect(existsSync(vitestDts)).toBe(true);
      expect(existsSync(vitestDcts)).toBe(true);
    },
  );

  it.skipIf(!openAiAgentsDistPresent)(
    "built OpenAI Agents adapter artifacts exist (run pnpm build first)",
    () => {
      expect(existsSync(openAiAgentsMjs)).toBe(true);
      expect(existsSync(openAiAgentsCjs)).toBe(true);
      expect(existsSync(openAiAgentsDts)).toBe(true);
      expect(existsSync(openAiAgentsDcts)).toBe(true);
    },
  );
});
