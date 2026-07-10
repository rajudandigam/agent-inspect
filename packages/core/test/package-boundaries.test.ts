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
      "vitest",
      "jest",
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

  it("@agent-inspect/vitest keeps vitest as peer (not dependency)", async () => {
    const reporter = await readPkg("packages/vitest/package.json");
    expect(reporter.peerDependencies?.vitest).toBeDefined();
    expect(reporter.dependencies?.vitest).toBeUndefined();
  });

  it("@agent-inspect/jest keeps jest as peer (not dependency)", async () => {
    const reporter = await readPkg("packages/jest/package.json");
    expect(reporter.peerDependencies?.jest).toBeDefined();
    expect(reporter.dependencies?.jest).toBeUndefined();
  });

  it("@agent-inspect/harness stays public-ready and dependency-light", async () => {
    const harness = await readPkg("packages/harness/package.json");
    expect(harness.name).toBe("@agent-inspect/harness");
    expect(harness.private).not.toBe(true);
    expect(keys(harness.dependencies)).toEqual(["agent-inspect"]);
    expect(keys(harness.peerDependencies)).toEqual([]);
  });

  it("@agent-inspect/redact is dependency-free and public", async () => {
    const redact = await readPkg("packages/redact/package.json");
    expect(redact.name).toBe("@agent-inspect/redact");
    expect(redact.private).toBeUndefined();
    expect(keys(redact.dependencies)).toEqual([]);
    expect(keys(redact.peerDependencies)).toEqual([]);
  });

  it("@agent-inspect/eval is public and depends on agent-inspect plus safety packages", async () => {
    const evalPkg = await readPkg("packages/eval/package.json");
    expect(evalPkg.name).toBe("@agent-inspect/eval");
    expect(evalPkg.private).toBeUndefined();
    expect(keys(evalPkg.dependencies)).toEqual([
      "@agent-inspect/circuit",
      "@agent-inspect/guardrails",
      "agent-inspect",
    ]);
    expect(keys(evalPkg.peerDependencies)).toEqual([]);
  });

  it("@agent-inspect/guardrails is public and depends on redact", async () => {
    const guardrails = await readPkg("packages/guardrails/package.json");
    expect(guardrails.name).toBe("@agent-inspect/guardrails");
    expect(guardrails.private).toBeUndefined();
    expect(keys(guardrails.dependencies)).toEqual(["@agent-inspect/redact"]);
    expect(keys(guardrails.peerDependencies)).toEqual([]);
  });

  it("@agent-inspect/circuit is dependency-free and public", async () => {
    const circuit = await readPkg("packages/circuit/package.json");
    expect(circuit.name).toBe("@agent-inspect/circuit");
    expect(circuit.private).toBeUndefined();
    expect(keys(circuit.dependencies)).toEqual([]);
    expect(keys(circuit.peerDependencies)).toEqual([]);
  });

  it("@agent-inspect/mcp is public and depends only on agent-inspect", async () => {
    const mcpPkg = await readPkg("packages/mcp/package.json");
    expect(mcpPkg.name).toBe("@agent-inspect/mcp");
    expect(mcpPkg.private).toBeUndefined();
    expect(keys(mcpPkg.dependencies)).toEqual(["agent-inspect"]);
    expect(keys(mcpPkg.peerDependencies)).toEqual([]);
  });

  it("@agent-inspect/viewer is public and depends on agent-inspect", async () => {
    const viewer = await readPkg("packages/viewer/package.json");
    expect(viewer.name).toBe("@agent-inspect/viewer");
    expect(viewer.private).toBeUndefined();
    expect(keys(viewer.dependencies)).toEqual(["agent-inspect"]);
    expect(keys(viewer.peerDependencies)).toEqual([]);
  });

  it("@agent-inspect/studio is public and depends on agent-inspect", async () => {
    const studio = await readPkg("packages/studio/package.json");
    expect(studio.name).toBe("@agent-inspect/studio");
    expect(studio.private).toBeUndefined();
    expect(keys(studio.dependencies)).toEqual(["agent-inspect", "better-sqlite3"]);
    expect(keys(studio.peerDependencies)).toEqual([]);
  });

  it("@agent-inspect/mcp-server is public and depends on agent-inspect", async () => {
    const mcpServer = await readPkg("packages/mcp-server/package.json");
    expect(mcpServer.name).toBe("@agent-inspect/mcp-server");
    expect(mcpServer.private).toBeUndefined();
    expect(keys(mcpServer.dependencies).sort()).toEqual(
      ["@agent-inspect/redact", "agent-inspect"].sort(),
    );
    expect(keys(mcpServer.peerDependencies)).toEqual([]);
  });

  it("@agent-inspect/adapter-sdk is public and depends on agent-inspect", async () => {
    const adapterSdk = await readPkg("packages/adapter-sdk/package.json");
    expect(adapterSdk.name).toBe("@agent-inspect/adapter-sdk");
    expect(adapterSdk.private).toBeUndefined();
    expect(keys(adapterSdk.dependencies)).toEqual(["agent-inspect"]);
    expect(keys(adapterSdk.peerDependencies)).toEqual([]);
  });
});
