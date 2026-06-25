import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { whatCommand } from "../src/what.js";

describe("what CLI", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-what-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    process.exitCode = 0;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("reports missing run", async () => {
    await whatCommand("missing", { dir: tmpDir });
    expect(process.exitCode).toBe(1);
    expect(logSpy.mock.calls.flat().join(" ")).toContain("Run not found");
  });

  it("requires run id", async () => {
    await whatCommand("  ", { dir: tmpDir });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.flat().join(" ")).toContain("Run id is required");
  });

  it("renders concise summary for fixture run", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces/minimal-success.jsonl",
    );
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(fixture, "utf-8");
    await writeFile(path.join(tmpDir, "minimal-success.jsonl"), raw);
    await whatCommand("minimal-success", { dir: tmpDir });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("What: minimal-success");
    expect(out).toContain("Outcome: Completed successfully.");
  });

  it("emits valid JSON", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces/llm-with-tokens.jsonl",
    );
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(fixture, "utf-8");
    await writeFile(path.join(tmpDir, "llm-with-tokens.jsonl"), raw);
    await whatCommand("llm-with-tokens", { dir: tmpDir, json: true });
    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(parsed.runId).toBe("llm-with-tokens");
    expect(parsed.totalTokens).toEqual({
      input: 1200,
      output: 356,
      total: 1556,
      cached: 240,
    });
  });
});
