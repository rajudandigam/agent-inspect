import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isAgentInspectEnabled, maybeInspectRun } from "../src/maybe-inspect-run.js";
import * as storage from "../src/storage.js";

describe("isAgentInspectEnabled", () => {
  it.each([
    ["1", true],
    ["true", true],
    ["TRUE", true],
    ["yes", true],
    ["on", true],
    ["enabled", true],
    [" Enabled ", true],
    ["0", false],
    ["false", false],
    ["no", false],
    ["", false],
    [undefined, false],
  ] as const)("isAgentInspectEnabled(%j) -> %s", (value, expected) => {
    expect(isAgentInspectEnabled(value)).toBe(expected);
  });
});

describe("maybeInspectRun", () => {
  let traceDir: string;
  const prevAgentInspect = process.env.AGENT_INSPECT;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-maybe-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
    delete process.env.AGENT_INSPECT;
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (prevAgentInspect === undefined) {
      delete process.env.AGENT_INSPECT;
    } else {
      process.env.AGENT_INSPECT = prevAgentInspect;
    }
    vi.restoreAllMocks();
  });

  it("env unset writes no trace", async () => {
    delete process.env.AGENT_INSPECT;
    await maybeInspectRun("off", async () => "ok", { traceDir, silent: true });
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(0);
  });

  it.each(["1", "true", "yes"])("AGENT_INSPECT=%s writes trace", async (value) => {
    process.env.AGENT_INSPECT = value;
    await maybeInspectRun("on", async () => "ok", { traceDir, silent: true });
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(1);
  });

  it("AGENT_INSPECT=0 writes no trace", async () => {
    process.env.AGENT_INSPECT = "0";
    await maybeInspectRun("off", async () => "ok", { traceDir, silent: true });
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(0);
  });

  it("explicit enabled true overrides env off", async () => {
    process.env.AGENT_INSPECT = "0";
    await maybeInspectRun("force-on", async () => "ok", {
      traceDir,
      silent: true,
      enabled: true,
    });
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(1);
  });

  it("explicit enabled false overrides env on", async () => {
    process.env.AGENT_INSPECT = "1";
    await maybeInspectRun("force-off", async () => "ok", {
      traceDir,
      silent: true,
      enabled: false,
    });
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(0);
  });

  it("respects traceDir when enabled via env", async () => {
    const sub = path.join(traceDir, "nested");
    await mkdir(sub, { recursive: true });
    process.env.AGENT_INSPECT = "on";
    await maybeInspectRun("nested", async () => 1, { traceDir: sub, silent: true });
    const files = await readdir(sub);
    expect(files.some((f) => f.endsWith(".jsonl"))).toBe(true);
  });

  it("respects silent when enabled via env", async () => {
    process.env.AGENT_INSPECT = "1";
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await maybeInspectRun("quiet", async () => {}, { traceDir, silent: true });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("throws TypeError when fn is not a function", async () => {
    await expect(
      maybeInspectRun(
        "bad",
        undefined as unknown as () => string,
        { traceDir },
      ),
    ).rejects.toThrow(TypeError);
  });

  it("returns user result when env enables tracing but storage fails", async () => {
    process.env.AGENT_INSPECT = "1";
    vi.spyOn(storage, "writeTraceEvent").mockImplementation(() =>
      Promise.reject(new Error("storage down")),
    );
    const result = await maybeInspectRun("res", async () => "still-ok", {
      traceDir,
      silent: true,
    });
    expect(result).toBe("still-ok");
  });
});
