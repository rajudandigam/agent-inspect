import { access } from "node:fs/promises";
import * as fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", async (importOriginal) => {
  const mod = await importOriginal<typeof import("node:fs/promises")>();
  return { ...mod, mkdir: vi.fn(mod.mkdir) };
});

import {
  createRunId,
  createStepId,
  ensureTraceDir,
  FALLBACK_TRACE_DIR,
  formatDuration,
  formatError,
  formatTimestamp,
  getDefaultTraceDir,
  getTraceFilePath,
  truncateName,
  warn,
} from "../src/utils.js";

async function resetMkdirToReal(): Promise<void> {
  const real = await vi.importActual<typeof import("node:fs/promises")>(
    "node:fs/promises",
  );
  vi.mocked(fsPromises.mkdir).mockImplementation(real.mkdir);
}

describe("createRunId", () => {
  it("starts with run_, has random segment, and is unique", () => {
    const a = createRunId();
    const b = createRunId();
    expect(a.startsWith("run_")).toBe(true);
    expect(a.length).toBe(4 + 10);
    expect(b.length).toBe(4 + 10);
    expect(a).not.toBe(b);
  });
});

describe("createStepId", () => {
  it("starts with step_, has random segment, and is unique", () => {
    const a = createStepId();
    const b = createStepId();
    expect(a.startsWith("step_")).toBe(true);
    expect(a.length).toBe(5 + 10);
    expect(b.length).toBe(5 + 10);
    expect(a).not.toBe(b);
  });
});

describe("formatDuration", () => {
  it("formats sub-second durations as whole ms", () => {
    expect(formatDuration(0)).toBe("0ms");
    expect(formatDuration(50)).toBe("50ms");
    expect(formatDuration(850)).toBe("850ms");
  });

  it("formats second+ durations with one decimal", () => {
    expect(formatDuration(1000)).toBe("1.0s");
    expect(formatDuration(1234)).toBe("1.2s");
    expect(formatDuration(5678)).toBe("5.7s");
  });

  it("returns 0ms for invalid inputs", () => {
    expect(formatDuration(-1)).toBe("0ms");
    expect(formatDuration(Number.NaN)).toBe("0ms");
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("0ms");
  });
});

describe("formatTimestamp", () => {
  it("returns a local YYYY-MM-DD HH:mm:ss string for valid input", () => {
    const s = formatTimestamp(Date.UTC(2026, 4, 1, 10, 23, 45));
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(s).not.toBe("Invalid date");
  });

  it("returns Invalid date for invalid timestamps", () => {
    expect(formatTimestamp(Number.NaN)).toBe("Invalid date");
    expect(formatTimestamp(Number.POSITIVE_INFINITY)).toBe("Invalid date");
  });
});

describe("getDefaultTraceDir", () => {
  it("includes .agent-inspect and runs", () => {
    const dir = getDefaultTraceDir();
    expect(dir).toContain(".agent-inspect");
    expect(dir).toContain("runs");
  });
});

describe("getTraceFilePath", () => {
  it("uses provided traceDir and runId.jsonl", () => {
    const p = getTraceFilePath("run_abc", "/tmp/custom-trace");
    expect(p).toBe(path.join("/tmp/custom-trace", "run_abc.jsonl"));
  });

  it("uses basename to avoid path traversal", () => {
    const p = getTraceFilePath("../../../etc/passwd", "/tmp/t");
    expect(p).toBe(path.join("/tmp/t", "passwd.jsonl"));
  });

  it("maps empty runId to run_unknown.jsonl", () => {
    const p = getTraceFilePath("", "/tmp/t");
    expect(p).toBe(path.join("/tmp/t", "run_unknown.jsonl"));
  });

  it("maps whitespace-only runId to run_unknown.jsonl", () => {
    const p = getTraceFilePath("   ", "/tmp/t");
    expect(p).toBe(path.join("/tmp/t", "run_unknown.jsonl"));
  });
});

describe("ensureTraceDir", () => {
  const created: string[] = [];

  beforeEach(async () => {
    created.length = 0;
    await resetMkdirToReal();
  });

  afterEach(async () => {
    await resetMkdirToReal();
    for (const dir of created) {
      try {
        await fsPromises.rm(dir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
    vi.clearAllMocks();
  });

  it("creates a temp trace directory and returns it", async () => {
    const dir = path.join(os.tmpdir(), `agent-inspect-test-${createRunId()}`);
    created.push(dir);
    const out = await ensureTraceDir(dir);
    expect(out).toBe(path.resolve(dir));
    await expect(access(dir)).resolves.toBeUndefined();
  });

  it("does not throw and falls back when primary mkdir fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const primary = path.join(os.tmpdir(), `agent-inspect-bad-${createRunId()}`);
    const real = await vi.importActual<typeof import("node:fs/promises")>(
      "node:fs/promises",
    );
    vi.mocked(fsPromises.mkdir).mockImplementation(async (pth, opts) => {
      if (path.resolve(String(pth)) === path.resolve(primary)) {
        return Promise.reject(new Error("mock primary fail"));
      }
      return real.mkdir(pth, opts);
    });

    const out = await ensureTraceDir(primary);
    expect(out).toBe(path.resolve(FALLBACK_TRACE_DIR));
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[AgentInspect\] Failed to create trace directory:/),
    );
    warnSpy.mockRestore();
  });

  it("returns original dir when both primary and fallback mkdir fail", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const primary = path.join(os.tmpdir(), `agent-inspect-bad2-${createRunId()}`);
    vi.mocked(fsPromises.mkdir).mockImplementation(() =>
      Promise.reject(new Error("always fail")),
    );

    const out = await ensureTraceDir(primary);
    expect(out).toBe(path.resolve(primary));
    expect(warnSpy).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });
});

describe("formatError", () => {
  it("formats Error instances", () => {
    const err = new Error("boom");
    err.stack = "stack-line";
    expect(formatError(err)).toEqual({ message: "boom", stack: "stack-line" });
  });

  it("formats strings", () => {
    expect(formatError("plain")).toEqual({ message: "plain" });
  });

  it("formats null and undefined", () => {
    expect(formatError(null)).toEqual({ message: "Unknown error: null" });
    expect(formatError(undefined)).toEqual({
      message: "Unknown error: undefined",
    });
  });

  it("JSON-stringifies plain objects", () => {
    expect(formatError({ a: 1 })).toEqual({ message: '{"a":1}' });
  });

  it("handles circular objects without throwing", () => {
    const o: { self?: unknown } = {};
    o.self = o;
    expect(formatError(o)).toEqual({ message: "Unknown error" });
  });
});

describe("truncateName", () => {
  it("returns short names unchanged", () => {
    expect(truncateName("hello")).toBe("hello");
  });

  it("truncates long names with ellipsis", () => {
    const long = "a".repeat(120);
    const out = truncateName(long, 20);
    expect(out.endsWith("...")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(20);
  });

  it("maps empty string to unnamed", () => {
    expect(truncateName("")).toBe("unnamed");
    expect(truncateName("   ")).toBe("unnamed");
  });
});

describe("warn", () => {
  it("prefixes with [AgentInspect] and never throws", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => warn("hello")).not.toThrow();
    expect(spy).toHaveBeenCalledWith("[AgentInspect] hello");
    spy.mockRestore();
  });

  it("includes formatted error message when error is provided", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warn("oops", new Error("bad"));
    expect(spy).toHaveBeenCalledWith("[AgentInspect] oops: bad");
    spy.mockRestore();
  });
});
