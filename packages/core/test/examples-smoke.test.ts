import { existsSync, readFileSync, readdirSync } from "node:fs";
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

const SPIKE_EXAMPLES = ["06-log-to-tree"] as const;

describe("MVP examples (static checks)", () => {
  it("each example has index.ts, package.json, and README.md", () => {
    for (const name of MVP_EXAMPLES) {
      const dir = path.join(examplesRoot, name);

      expect(existsSync(path.join(dir, "index.ts"))).toBe(true);
      expect(existsSync(path.join(dir, "package.json"))).toBe(true);
      expect(existsSync(path.join(dir, "README.md"))).toBe(true);
    }
  });

  it("each package.json depends on agent-inspect via file:../..", () => {
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

  it("examples avoid banned secrets and SDK hints", () => {
    const banned = [
      "OPENAI_API_KEY",
      'from "openai"',
      "from 'openai'",
      "@langchain",
      "langchain/",
      "@ai-sdk",
      'from "express"',
      "from 'express'",
      'from "bullmq"',
      "from 'bullmq'",
      "@vercel",
    ];

    for (const name of MVP_EXAMPLES) {
      const src = readFileSync(
        path.join(examplesRoot, name, "index.ts"),
        "utf-8",
      );

      for (const token of banned) {
        expect(
          src.includes(token),
          `${name} should not contain ${token}`,
        ).toBe(false);
      }
    }
  });

  it("examples do not hardcode silent: true and use AGENT_INSPECT_SILENT", () => {
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

  it("examples root README lists the MVP examples", () => {
    const readme = readFileSync(path.join(examplesRoot, "README.md"), "utf-8");

    expect(readme).toContain("01-basic");
    expect(readme).toContain("02-nested-steps");
    expect(readme).toContain("03-parallel-steps");
    expect(readme).toContain("04-error-handling");
    expect(readme).toContain("05-observe-wrapper");
  });

  it("examples/ contains the MVP examples plus the v0.3 spike folder", () => {
    const dirs = readdirSync(examplesRoot)
      .filter((name) => /^\d{2}-/.test(name))
      .sort();

    expect(dirs).toEqual([...MVP_EXAMPLES, ...SPIKE_EXAMPLES].sort());
  });

  it("documentation and examples are readable multi-line files", () => {
    const filesWithMinimumLines: Array<[string, number]> = [
      [path.join(repoRoot, "README.md"), 80],
      [path.join(examplesRoot, "README.md"), 30],
      [path.join(examplesRoot, "01-basic", "index.ts"), 35],
      [path.join(examplesRoot, "02-nested-steps", "index.ts"), 35],
      [path.join(examplesRoot, "03-parallel-steps", "index.ts"), 35],
      [path.join(examplesRoot, "04-error-handling", "index.ts"), 30],
      [path.join(examplesRoot, "05-observe-wrapper", "index.ts"), 35],
      [
        path.join(
          repoRoot,
          "packages",
          "core",
          "test",
          "examples-smoke.test.ts",
        ),
        100,
      ],
    ];

    for (const [filePath, minimumLines] of filesWithMinimumLines) {
      const content = readFileSync(filePath, "utf-8");
      const lineCount = content.split(/\r?\n/).length;

      expect(
        lineCount,
        `${path.relative(repoRoot, filePath)} should be readable multi-line content`,
      ).toBeGreaterThanOrEqual(minimumLines);
    }
  });

  it("examples/ contains the MVP examples plus the v0.3 spike folder", () => {
    const entries = readdirSync(examplesRoot, { withFileTypes: true });

    const dirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => /^\d{2}-/.test(name));

    expect(dirs.sort()).toEqual([...MVP_EXAMPLES, ...SPIKE_EXAMPLES].sort());
  });
});

describe("Spike examples (static checks)", () => {
  it("log-to-tree spike has required files", () => {
    for (const name of SPIKE_EXAMPLES) {
      const dir = path.join(examplesRoot, name);

      expect(existsSync(path.join(dir, "sample-json.log"))).toBe(true);
      expect(existsSync(path.join(dir, "sample-log4js.log"))).toBe(true);
      expect(existsSync(path.join(dir, "agent-inspect.logs.json"))).toBe(true);
      expect(existsSync(path.join(dir, "expected-output.txt"))).toBe(true);
      expect(existsSync(path.join(dir, "prototype-parser.mjs"))).toBe(true);
      expect(existsSync(path.join(dir, "README.md"))).toBe(true);
    }
  });
});
