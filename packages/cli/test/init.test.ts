import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initCommand, planInit } from "../src/init.js";

describe("init CLI", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-cli-init-"));
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("dry-run reports planned files deterministically", async () => {
    const plan = await planInit({ framework: "custom", cwd: tmpDir });
    expect(plan.framework).toBe("custom");
    expect(plan.files.map((file) => file.path)).toEqual([
      "agent-inspect.config.ts",
      ".agent-inspect/.gitkeep",
      "examples/agent-inspect-demo.mjs",
    ]);
  });

  it("creates config, trace dir marker, and demo file", async () => {
    await initCommand({ framework: "custom", cwd: tmpDir, yes: true });
    await access(path.join(tmpDir, "agent-inspect.config.ts"));
    await access(path.join(tmpDir, ".agent-inspect/.gitkeep"));
    await access(path.join(tmpDir, "examples/agent-inspect-demo.mjs"));
    const config = await readFile(path.join(tmpDir, "agent-inspect.config.ts"), "utf8");
    expect(config).toContain("traceDir");
    const demo = await readFile(path.join(tmpDir, "examples/agent-inspect-demo.mjs"), "utf8");
    expect(demo).not.toMatch(/input:\s*\{/);
  });

  it("supports --json dry-run output", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await initCommand({ framework: "ai-sdk", cwd: tmpDir, dryRun: true, json: true });
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.framework).toBe("ai-sdk");
    expect(payload.dryRun).toBe(true);
    expect(payload.planned.length).toBeGreaterThan(0);
  });

  it("adds GitHub workflow snippet with --ci github", async () => {
    await initCommand({ framework: "custom", cwd: tmpDir, ci: "github", yes: true });
    const workflow = await readFile(
      path.join(tmpDir, ".github/workflows/agent-inspect-artifacts.yml"),
      "utf8",
    );
    expect(workflow).toContain("upload-artifact");
  });
});
