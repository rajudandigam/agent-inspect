import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const rulePath = new URL(
  "../../../../scripts/lib/package-readme-support-rule.mjs",
  import.meta.url,
).href;

type GoverningSupportRow = { level: string; label: string };
type SupportRuleModule = {
  parseSupportRows(markdown: string): GoverningSupportRow[];
  resolveSupportPackages(label: string): string[];
  buildSupportMatrixLevels(markdown: string): Map<string, GoverningSupportRow>;
  supportLevelDisagreement(
    matrixLevels: Map<string, GoverningSupportRow>,
    packageName: string,
    declaredLevel: string,
  ): GoverningSupportRow | null;
};

const {
  parseSupportRows,
  resolveSupportPackages,
  buildSupportMatrixLevels,
  supportLevelDisagreement,
} = (await import(rulePath)) as SupportRuleModule;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const supportLevels = readFileSync(path.join(repoRoot, "docs/SUPPORT-LEVELS.md"), "utf8");
const matrixLevels = buildSupportMatrixLevels(supportLevels);

const proseBoundPackages = [
  "@agent-inspect/ai-sdk",
  "@agent-inspect/openai-agents",
  "@agent-inspect/langchain",
  "@agent-inspect/vitest",
  "@agent-inspect/jest",
];

describe("package README canonical support rules", () => {
  it("parses canonical prose rows without requiring backticked package identifiers", () => {
    expect(parseSupportRows(supportLevels)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: expect.stringMatching(/^Official adapters/),
          level: "Supported",
        }),
        { label: "Vitest / Jest reporters", level: "Supported" },
      ]),
    );
  });

  it("preserves explicit backticked package bindings", () => {
    expect(matrixLevels.get("@agent-inspect/harness")).toEqual({
      label: "`@agent-inspect/harness`",
      level: "Supported",
    });
  });

  it.each(proseBoundPackages)("accepts %s when its README matches canonical support", (name) => {
    expect(matrixLevels.get(name)?.level).toBe("Supported");
    expect(supportLevelDisagreement(matrixLevels, name, "Supported")).toBeNull();
  });

  it.each(proseBoundPackages)("rejects %s when its README drifts from canonical support", (name) => {
    expect(supportLevelDisagreement(matrixLevels, name, "Beta")).toEqual(
      expect.objectContaining({ level: "Supported" }),
    );
  });

  it("takes prose-bound maturity from the canonical row instead of the allowlist", () => {
    const changedMatrix = buildSupportMatrixLevels(
      "| Official adapters (ai-sdk, openai-agents, langchain / LangGraph fidelity classes) | Beta |",
    );

    expect(changedMatrix.get("@agent-inspect/ai-sdk")?.level).toBe("Beta");
  });

  it("does not infer package identities for unrelated canonical prose rows", () => {
    expect(resolveSupportPackages("TraceContract API")).toEqual([]);
    expect(resolveSupportPackages("Workspace / bundles / observed outcomes / Evidence v2")).toEqual(
      [],
    );
  });

  it.each([
    "@agent-inspect/mcp",
    "@agent-inspect/tui",
    "@agent-inspect/eval",
    "@agent-inspect/guardrails",
    "@agent-inspect/circuit",
  ])("keeps %s unresolved", (name) => {
    expect(matrixLevels.has(name)).toBe(false);
  });
});
