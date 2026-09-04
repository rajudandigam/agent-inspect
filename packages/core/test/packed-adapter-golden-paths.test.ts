/**
 * Contract: every official adapter keeps a no-key packed-consumer golden path,
 * and the packed checks never require provider secrets.
 *
 * This enforces the #213 acceptance invariant as a regression: an official
 * adapter cannot be added or a packed check dropped without failing here, and
 * the packed openai-agents path must keep proving it runs with credentials
 * stripped. It does not implement individual adapter paths (those live in the
 * pack-smoke scripts); it pins that the coverage exists and stays keyless.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), "utf8");
}

// The official framework adapters per docs/SUPPORT-LEVELS.md.
const OFFICIAL_ADAPTERS = [
  "@agent-inspect/ai-sdk",
  "@agent-inspect/openai-agents",
  "@agent-inspect/langchain",
] as const;

describe("packed adapter no-key golden paths (#213 contract)", () => {
  const packageSmoke = read("scripts/package-smoke.mjs");
  const packSmokeScript = (
    JSON.parse(read("package.json")) as { scripts: Record<string, string> }
  ).scripts["pack:smoke"];

  it("wires the packed smoke and openai-agents e2e into pack:smoke", () => {
    expect(packSmokeScript).toBeDefined();
    expect(packSmokeScript).toContain("scripts/package-smoke.mjs");
    expect(packSmokeScript).toContain("scripts/packed-openai-agents-e2e.mjs");
  });

  for (const adapter of OFFICIAL_ADAPTERS) {
    it(`covers ${adapter} with a packed-consumer check`, () => {
      const hasSmokeCheck = packageSmoke.includes(`name: "${adapter}"`);
      const short = adapter.replace("@agent-inspect/", "");
      const hasDedicatedE2e = existsSync(
        path.join(repoRoot, `scripts/packed-${short}-e2e.mjs`),
      );
      expect(
        hasSmokeCheck || hasDedicatedE2e,
        `${adapter} has no packed-consumer golden path`,
      ).toBe(true);
    });
  }

  it("proves the openai-agents packed path runs without provider credentials", () => {
    const e2e = read("scripts/packed-openai-agents-e2e.mjs");
    // The consumer runs with OpenAI credentials stripped from the environment.
    expect(e2e).toContain("OPENAI_API_KEY");
    expect(e2e).toMatch(/delete env\[/);
  });

  it("does not require provider secrets in the packed adapter checks", () => {
    // No packed script may assign a provider key; the only OpenAI reference is
    // the strip list above. An assignment like OPENAI_API_KEY = ... would leak
    // a secret requirement into CI.
    for (const rel of ["scripts/package-smoke.mjs", "scripts/packed-openai-agents-e2e.mjs"]) {
      const text = read(rel);
      expect(text, `${rel} assigns a provider key`).not.toMatch(
        /(OPENAI_API_KEY|ANTHROPIC_API_KEY)\s*[:=]\s*["'`]/,
      );
    }
  });
});
