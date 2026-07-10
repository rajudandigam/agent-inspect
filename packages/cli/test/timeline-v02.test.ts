import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { timelineCommand } from "../src/timeline.js";

describe("timeline CLI v0.2 fixtures", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-timeline-v02-${Date.now()}`);
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

  it("renders manual-basic v0.2 fixture", async () => {
    const fixture = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../fixtures/traces-v0.2/manual-basic.jsonl",
    );
    const raw = await readFile(fixture, "utf-8");
    await writeFile(path.join(tmpDir, "manual-basic.jsonl"), raw);
    await timelineCommand("manual-basic", { dir: tmpDir });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("Timeline:");
    expect(out).toContain("generate");
  });
});
