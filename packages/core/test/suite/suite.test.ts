import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  loadSuiteConfig,
  normalizeSuiteConfig,
  renderSuiteReportMarkdown,
  runSuite,
  validateSuiteConfig,
} from "../../src/suite/index.js";

describe("trace suite config", () => {
  it("normalizes a valid config object", () => {
    const config = normalizeSuiteConfig({
      name: "demo",
      traces: "./traces",
      cases: [{ id: "basic", runId: "basic-run" }],
    });
    expect(config.name).toBe("demo");
    expect(config.cases).toHaveLength(1);
  });

  it("rejects duplicate case ids", () => {
    expect(() =>
      normalizeSuiteConfig({
        name: "demo",
        traces: "./traces",
        cases: [
          { id: "dup", runId: "a" },
          { id: "dup", runId: "b" },
        ],
      }),
    ).toThrow(/Duplicate case id/);
  });

  it("loads JSON config from disk", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "suite-load-"));
    try {
      const configPath = path.join(dir, "agent-inspect.suite.json");
      await writeFile(
        configPath,
        JSON.stringify({
          name: "disk-suite",
          traces: ".",
          cases: [{ id: "case-1" }],
        }),
        "utf-8",
      );
      const loaded = await loadSuiteConfig({ configPath });
      expect(loaded.config.name).toBe("disk-suite");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("validates traces directory existence", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "suite-validate-"));
    try {
      const tracesDir = path.join(dir, "traces");
      await mkdir(tracesDir, { recursive: true });
      const config = normalizeSuiteConfig({
        name: "valid",
        traces: "./traces",
        cases: [{ id: "case-1" }],
      });
      const result = await validateSuiteConfig(config, { configDir: dir });
      expect(result.ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("runs suite checks against outcome-mixed fixture", async () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../../..");
    const configPath = path.join(repoRoot, "fixtures/configs/outcome-suite.suite.json");
    const result = await runSuite({ configPath });
    expect(result.suiteName).toBe("outcome-suite");
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0]?.status).toBe("pass");
    expect(result.ok).toBe(true);
    const markdown = renderSuiteReportMarkdown(result);
    expect(markdown).toContain("outcome-pass");
    expect(markdown).toContain("PASS");
  });
});
