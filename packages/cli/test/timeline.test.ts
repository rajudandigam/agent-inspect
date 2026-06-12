import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { timelineCommand } from "../src/timeline.js";

describe("timeline CLI", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-timeline-${Date.now()}`);
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
    await timelineCommand("missing", { dir: tmpDir });
    expect(process.exitCode).toBe(1);
    expect(logSpy.mock.calls.flat().join(" ")).toContain("Run not found");
  });

  it("renders fixture run", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces/minimal-success.jsonl",
    );
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(fixture, "utf-8");
    await writeFile(path.join(tmpDir, "minimal-success.jsonl"), raw);
    await timelineCommand("minimal-success", { dir: tmpDir });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("Timeline:");
    expect(out).toContain("plan");
  });

  it("emits valid JSON", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces/minimal-success.jsonl",
    );
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(fixture, "utf-8");
    await writeFile(path.join(tmpDir, "minimal-success.jsonl"), raw);
    await timelineCommand("minimal-success", { dir: tmpDir, json: true });
    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(parsed.runId).toBe("minimal-success");
    expect(Array.isArray(parsed.entries)).toBe(true);
  });
});
