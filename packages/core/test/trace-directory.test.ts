import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, afterEach, describe, expect, it } from "vitest";

import { TraceDirectory } from "../src/trace-directory.js";
import { getDefaultTraceDir } from "../src/utils.js";

describe("TraceDirectory", () => {
  let tmpDir: string;
  const prevEnv = process.env.AGENT_INSPECT_TRACE_DIR;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-trace-dir-"));
    delete process.env.AGENT_INSPECT_TRACE_DIR;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    if (prevEnv === undefined) {
      delete process.env.AGENT_INSPECT_TRACE_DIR;
    } else {
      process.env.AGENT_INSPECT_TRACE_DIR = prevEnv;
    }
  });

  it("explicit directory wins", () => {
    const td = new TraceDirectory({ dir: tmpDir });
    expect(td.getPath()).toBe(tmpDir);
  });

  it("AGENT_INSPECT_TRACE_DIR is used when explicit dir missing", () => {
    process.env.AGENT_INSPECT_TRACE_DIR = tmpDir;
    const td = new TraceDirectory();
    expect(td.getPath()).toBe(tmpDir);
  });

  it("explicit directory wins over env var", () => {
    process.env.AGENT_INSPECT_TRACE_DIR = "/should-not-use";
    const td = new TraceDirectory({ dir: tmpDir });
    expect(td.getPath()).toBe(tmpDir);
  });

  it("default path matches existing getDefaultTraceDir behavior", () => {
    const td = new TraceDirectory();
    expect(td.getPath()).toBe(getDefaultTraceDir());
  });

  it("list returns only .jsonl files", async () => {
    await writeFile(path.join(tmpDir, "a.jsonl"), "");
    await writeFile(path.join(tmpDir, "b.jsonl"), "");
    await writeFile(path.join(tmpDir, "c.txt"), "");

    const td = new TraceDirectory({ dir: tmpDir });
    const files = await td.list();
    expect(files.sort()).toEqual(["a.jsonl", "b.jsonl"]);
  });

  it("list returns [] for missing directory", async () => {
    const missing = path.join(tmpDir, "does-not-exist");
    const td = new TraceDirectory({ dir: missing });
    expect(await td.list()).toEqual([]);
  });

  it("getFileStats works", async () => {
    const name = "x.jsonl";
    await mkdir(tmpDir, { recursive: true });
    await writeFile(path.join(tmpDir, name), "hello");
    const td = new TraceDirectory({ dir: tmpDir });
    const stats = await td.getFileStats(name);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });
});

