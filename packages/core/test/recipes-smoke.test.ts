import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const recipesRoot = path.join(repoRoot, "examples", "recipes");

const RECIPES = [
  "rag-pipeline",
  "tool-failure-retry",
  "multi-agent-handoff",
  "proactive-agent-logs",
  "retry-fallback",
  "parallel-tools",
  "runtime-and-ingestion",
  "openai-agents-local-tracing",
] as const;

const SECTION_MARKERS = [
  "## What this demonstrates",
  "## Why this matters",
  "## How to run",
  "## Expected output",
  "## What to look for",
  "## Notes and limitations",
] as const;

describe("examples/recipes (v0.9)", () => {
  it("has examples/recipes/README.md", () => {
    expect(existsSync(path.join(recipesRoot, "README.md"))).toBe(true);
  });

  it("each recipe has required files, private package, README sections, no banned hints", () => {
    for (const name of RECIPES) {
      const dir = path.join(recipesRoot, name);
      expect(existsSync(path.join(dir, "README.md")), `${name} README`).toBe(true);
      expect(existsSync(path.join(dir, "expected-output.txt")), `${name} expected-output`).toBe(
        true,
      );
      expect(
        readFileSync(path.join(dir, "expected-output.txt"), "utf-8").trim().length,
      ).toBeGreaterThan(0);

      expect(existsSync(path.join(dir, "package.json")), `${name} package.json`).toBe(true);
      expect(existsSync(path.join(dir, "src", "index.ts")), `${name} src/index.ts`).toBe(true);

      const pkg = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf-8")) as {
        private?: boolean;
      };
      expect(pkg.private).toBe(true);

      const readme = readFileSync(path.join(dir, "README.md"), "utf-8");
      for (const heading of SECTION_MARKERS) {
        expect(readme.includes(heading), `${name} missing ${heading}`).toBe(true);
      }

      expect(readme.toLowerCase()).toContain("version ownership");

      expect(readme.toLowerCase()).not.toContain("gmail.com");
      expect(readme + readFileSync(path.join(dir, "src", "index.ts"), "utf-8")).not.toMatch(
        /sk_live[0-9a-zA-Z_]/,
      );

      const src = readFileSync(path.join(dir, "src", "index.ts"), "utf-8");
      if (name !== "proactive-agent-logs") {
        expect(src).toMatch(/from\s+["']agent-inspect(?:\/[^"']+)?["']/);
      }
      expect(src).not.toMatch(/from\s+["']openai["']/);
      if (name !== "openai-agents-local-tracing") {
        expect(src).not.toMatch(/from\s+["']@openai\/agents["']/);
      }
      expect(src).not.toMatch(/from\s+["']@anthropic-ai/);
      expect(src).not.toMatch(/from\s+["']@nestjs/);
      expect(src).not.toMatch(/from\s+["']langchain/);

      if (name === "proactive-agent-logs") {
        expect(existsSync(path.join(dir, "agent-inspect.logs.json"))).toBe(true);
        expect(existsSync(path.join(dir, "sample-json.log"))).toBe(true);
        expect(existsSync(path.join(dir, "sample-log4js.log"))).toBe(true);
      }
    }
  });
});
