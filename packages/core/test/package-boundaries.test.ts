import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type PackageJson = {
  name?: string;
  private?: boolean;
  bin?: Record<string, string> | string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

async function readPkg(rel: string): Promise<PackageJson> {
  const raw = await readFile(path.join(repoRoot, rel), "utf-8");
  return JSON.parse(raw) as PackageJson;
}

function keys(obj: Record<string, string> | undefined): string[] {
  return Object.keys(obj ?? {}).sort();
}

describe("package boundaries", () => {
  it("root runtime dependencies remain lean", async () => {
    const root = await readPkg("package.json");
    expect(keys(root.dependencies)).toEqual(["chalk", "commander", "nanoid"]);
  });

  it("root package does not pull heavy/forbidden deps", async () => {
    const root = await readPkg("package.json");
    const deps = keys(root.dependencies);
    for (const banned of [
      "@langchain/core",
      "ink",
      "react",
      "@opentelemetry/sdk-node",
      "@opentelemetry/api",
    ]) {
      expect(deps).not.toContain(banned);
    }
  });

  it("root package exposes agent-inspect bin", async () => {
    const root = await readPkg("package.json");
    expect(root.name).toBe("agent-inspect");
    expect(typeof root.bin).toBe("object");
    expect((root.bin as any)?.["agent-inspect"]).toContain("packages/cli/dist/index.cjs");
  });

  it("@agent-inspect/cli is private in the workspace", async () => {
    const cli = await readPkg("packages/cli/package.json");
    expect(cli.name).toBe("@agent-inspect/cli");
    expect(cli.private).toBe(true);
  });

  it("@agent-inspect/core does not depend on langchain/ink/react", async () => {
    const core = await readPkg("packages/core/package.json");
    const deps = keys(core.dependencies);
    for (const banned of ["@langchain/core", "ink", "react"]) {
      expect(deps).not.toContain(banned);
    }
  });

  it("@agent-inspect/langchain keeps @langchain/core as peer (not dependency)", async () => {
    const lc = await readPkg("packages/langchain/package.json");
    expect(lc.peerDependencies?.["@langchain/core"]).toBeDefined();
    expect(lc.dependencies?.["@langchain/core"]).toBeUndefined();
  });

  it("@agent-inspect/tui isolates ink/react dependencies", async () => {
    const tui = await readPkg("packages/tui/package.json");
    const deps = keys(tui.dependencies);
    expect(deps).toContain("ink");
    expect(deps).toContain("react");
  });
});

