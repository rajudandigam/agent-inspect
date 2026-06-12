import { cp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchCommand } from "../src/search.js";

describe("search CLI", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-search-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("finds error status", async () => {
    const fixtures = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces",
    );
    await cp(path.join(fixtures, "minimal-error.jsonl"), path.join(tmpDir, "minimal-error.jsonl"));
    await searchCommand({ dir: tmpDir, status: "error" });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("minimal-error");
  });

  it("finds tool steps", async () => {
    const fixtures = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces",
    );
    await cp(path.join(fixtures, "tool-with-io.jsonl"), path.join(tmpDir, "tool-with-io.jsonl"));
    await searchCommand({ dir: tmpDir, kind: "tool" });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("tool");
  });

  it("emits valid JSON", async () => {
    const fixtures = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces",
    );
    await cp(path.join(fixtures, "minimal-success.jsonl"), path.join(tmpDir, "minimal-success.jsonl"));
    await searchCommand({ dir: tmpDir, json: true });
    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(Array.isArray(parsed)).toBe(true);
  });
});
