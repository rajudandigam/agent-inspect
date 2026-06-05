import { access, mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hasActiveContext } from "../src/context.js";
import { inspectRun } from "../src/inspect-run.js";

describe("inspectRun enabled option", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-enabled-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    vi.restoreAllMocks();
  });

  it("default (enabled omitted) still writes trace", async () => {
    await inspectRun("default-run", async () => "ok", { traceDir, silent: true });
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(1);
  });

  it("enabled true writes trace", async () => {
    await inspectRun("on-run", async () => "ok", {
      traceDir,
      silent: true,
      enabled: true,
    });
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(1);
  });

  it("enabled false writes no trace file", async () => {
    await inspectRun("off-run", async () => "ok", {
      traceDir,
      silent: true,
      enabled: false,
    });
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(0);
  });

  it("enabled false returns user result", async () => {
    const result = await inspectRun("result-run", async () => ({ value: 42 }), {
      traceDir,
      enabled: false,
    });
    expect(result).toEqual({ value: 42 });
  });

  it("enabled false rethrows user error", async () => {
    const err = new Error("user failure");
    await expect(
      inspectRun(
        "err-run",
        async () => {
          throw err;
        },
        { traceDir, enabled: false },
      ),
    ).rejects.toBe(err);
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(0);
  });

  it("enabled false does not create trace directory", async () => {
    const missingDir = path.join(traceDir, "should-not-exist");
    await inspectRun("no-dir", async () => "ok", {
      traceDir: missingDir,
      enabled: false,
    });
    await expect(access(missingDir)).rejects.toThrow();
  });

  it("enabled false does not establish execution context", async () => {
    await inspectRun(
      "no-ctx",
      async () => {
        expect(hasActiveContext()).toBe(false);
        return 1;
      },
      { traceDir, enabled: false },
    );
    expect(hasActiveContext()).toBe(false);
  });

  it("enabled false prints no run output", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await inspectRun("quiet-off", async () => "x", { traceDir, enabled: false });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
