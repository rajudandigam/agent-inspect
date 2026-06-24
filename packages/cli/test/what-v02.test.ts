import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { whatCommand } from "../src/what.js";

describe("what CLI v0.2 fixtures", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-what-v02-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    process.exitCode = 0;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    vi.restoreAllMocks();
    await import("node:fs/promises").then(({ rm }) =>
      rm(tmpDir, { recursive: true, force: true }),
    );
  });

  it("summarizes manual-basic v0.2 fixture", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces-v0.2/manual-basic.jsonl",
    );
    const raw = await readFile(fixture, "utf-8");
    await writeFile(path.join(tmpDir, "manual-basic.jsonl"), raw);
    await whatCommand("manual-basic", { dir: tmpDir });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("support-agent");
    expect(out).toContain("LLM");
  });
});
