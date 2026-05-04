import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const examplesRoot = path.join(repoRoot, "examples");

const MVP_EXAMPLES = [
  "01-basic",
  "02-nested-steps",
  "03-parallel-steps",
  "04-error-handling",
  "05-observe-wrapper",
] as const;

describe("MVP examples (static checks)", () => {
  it("each example has index.ts, package.json, README.md", () => {
    for (const name of MVP_EXAMPLES) {
      const dir = path.join(examplesRoot, name);
      expect(existsSync(path.join(dir, "index.ts"))).toBe(true);
      expect(existsSync(path.join(dir, "package.json"))).toBe(true);
      expect(existsSync(path.join(dir, "README.md"))).toBe(true);
    }
  });

  it('each package.json depends on agent-inspect via file:../..', () => {
    const expectedNames: Record<(typeof MVP_EXAMPLES)[number], string> = {
      "01-basic": "agent-inspect-example-01-basic",
      "02-nested-steps": "agent-inspect-example-02-nested-steps",
      "03-parallel-steps": "agent-inspect-example-03-parallel-steps",
      "04-error-handling": "agent-inspect-example-04-error-handling",
      "05-observe-wrapper": "agent-inspect-example-05-observe-wrapper",
    };
    for (const name of MVP_EXAMPLES) {
      const raw = readFileSync(
        path.join(examplesRoot, name, "package.json"),
        "utf-8",
      );
      const pkg = JSON.parse(raw) as {
        name?: string;
        private?: boolean;
        dependencies?: Record<string, string>;
      };
      expect(pkg.name).toBe(expectedNames[name]);
      expect(pkg.private).toBe(true);
      expect(pkg.dependencies?.["agent-inspect"]).toBe("file:../..");
      expect(pkg.dependencies?.tsx).toMatch(/^\^/);
    }
  });

  it('each index.ts imports from "agent-inspect" and not workspace packages', () => {
    for (const name of MVP_EXAMPLES) {
      const src = readFileSync(
        path.join(examplesRoot, name, "index.ts"),
        "utf-8",
      );
      expect(src).toMatch(/from\s+["']agent-inspect["']/);
      expect(src).not.toContain("@agent-inspect/core");
      expect(src).not.toContain("@agent-inspect/cli");
    }
  });

  it("examples avoid banned secrets / SDK hints", () => {
    const banned = [
      "OPENAI_API_KEY",
      "from \"openai\"",
      "from 'openai'",
      "@langchain",
      "langchain/",
      "@ai-sdk",
      "from \"express\"",
      "from 'express'",
      "from \"bullmq\"",
      "from 'bullmq'",
      "@vercel",
    ];
    for (const name of MVP_EXAMPLES) {
      const src = readFileSync(
        path.join(examplesRoot, name, "index.ts"),
        "utf-8",
      );
      for (const b of banned) {
        expect(src.includes(b), `${name} should not contain ${b}`).toBe(false);
      }
    }
  });

  it("examples do not hardcode silent: true; use AGENT_INSPECT_SILENT", () => {
    for (const name of MVP_EXAMPLES) {
      const src = readFileSync(
        path.join(examplesRoot, name, "index.ts"),
        "utf-8",
      );
      expect(/silent:\s*true/.test(src), `${name} must not use silent: true`).toBe(
        false,
      );
      expect(src).toContain("AGENT_INSPECT_SILENT");
      expect(src).toContain("{ silent }");
    }
  });

  it("examples root README lists MVP table", () => {
    const readme = readFileSync(
      path.join(examplesRoot, "README.md"),
      "utf-8",
    );
    expect(readme).toContain("01-basic");
    expect(readme).toContain("EXAMPLES_ROADMAP");
  });

  it("roadmap doc exists and marks post-MVP items as future", () => {
    const roadmap = readFileSync(
      path.join(repoRoot, "docs", "EXAMPLES_ROADMAP.md"),
      "utf-8",
    );
    expect(roadmap).toContain("06-rag-pipeline");
    expect(roadmap).toContain("post-MVP");
    expect(roadmap).toMatch(/must not expand|MVP scope/i);
    expect(roadmap).toMatch(/must not add dependencies|dependencies/i);
  });

  it("case study doc exists", () => {
    expect(
      existsSync(
        path.join(repoRoot, "docs", "CASE_STUDY_CONSOLE_LOG_TO_AGENT_INSPECT.md"),
      ),
    ).toBe(true);
  });

  it("examples/ contains exactly the five MVP example dirs", () => {
    const entries = readdirSync(examplesRoot, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((n) => /^\d{2}-/.test(n));
    expect(dirs.sort()).toEqual([...MVP_EXAMPLES].sort());
  });
});
