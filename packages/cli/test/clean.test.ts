import { mkdir, rm, writeFile, readFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let promptAnswer = "no";
vi.mock("node:readline/promises", () => {
  return {
    createInterface: () => ({
      question: async () => promptAnswer,
      close: () => {},
    }),
  };
});

import { clean } from "../src/clean.js";

function jsonl(...lines: string[]): string {
  return lines.join("\n") + "\n";
}

function runStarted(runId: string, name: string, t: number): string {
  return JSON.stringify({
    schemaVersion: "0.1",
    event: "run_started",
    timestamp: t,
    runId,
    name,
    startTime: t,
  });
}

function runCompleted(runId: string, status: "success" | "error", t: number): string {
  return JSON.stringify({
    schemaVersion: "0.1",
    event: "run_completed",
    timestamp: t,
    runId,
    status,
    endTime: t,
    durationMs: 1,
  });
}

async function writeTrace(dir: string, runId: string, name: string, start: number): Promise<void> {
  await writeFile(
    path.join(dir, `${runId}.jsonl`),
    jsonl(runStarted(runId, name, start), runCompleted(runId, "success", start + 1)),
    "utf-8",
  );
}

describe("clean", () => {
  let traceDir: string;
  const prevEnv = process.env.AGENT_INSPECT_TRACE_DIR;
  let originalIsTTY: unknown;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-cli-clean-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
    delete process.env.AGENT_INSPECT_TRACE_DIR;

    originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (prevEnv === undefined) delete process.env.AGENT_INSPECT_TRACE_DIR;
    else process.env.AGENT_INSPECT_TRACE_DIR = prevEnv;

    Object.defineProperty(process.stdin, "isTTY", {
      value: originalIsTTY,
      configurable: true,
    });
  });

  it("requires either --older-than or --keep", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await clean({ dir: traceDir });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("requires either"))).toBe(true);
    errSpy.mockRestore();
  });

  it("rejects both --older-than and --keep together", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await clean({ dir: traceDir, olderThan: "1h", keep: "10" });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("not both"))).toBe(true);
    errSpy.mockRestore();
  });

  it("--older-than dry-run lists only old verified traces", async () => {
    const now = Date.now();
    await writeTrace(traceDir, "run_old", "old", now - 3_600_000);
    await writeTrace(traceDir, "run_new", "new", now - 10_000);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await clean({ dir: traceDir, olderThan: "1h", dryRun: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Would delete");
    expect(out).toContain("run_old.jsonl");
    expect(out).not.toContain("run_new.jsonl");
    logSpy.mockRestore();
  });

  it("--keep dry-run keeps newest N verified traces", async () => {
    const now = Date.now();
    await writeTrace(traceDir, "run_1", "r1", now - 30_000);
    await writeTrace(traceDir, "run_2", "r2", now - 20_000);
    await writeTrace(traceDir, "run_3", "r3", now - 10_000);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await clean({ dir: traceDir, keep: "1", dryRun: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Would delete");
    // Should delete two oldest, keep newest (run_3)
    expect(out).toContain("run_1.jsonl");
    expect(out).toContain("run_2.jsonl");
    expect(out).not.toContain("run_3.jsonl");
    logSpy.mockRestore();
  });

  it("dry-run deletes nothing", async () => {
    const now = Date.now();
    await writeTrace(traceDir, "run_a", "a", now - 3_600_000);
    await clean({ dir: traceDir, olderThan: "1h", dryRun: true });
    const files = await readdir(traceDir);
    expect(files.some((f) => f === "run_a.jsonl")).toBe(true);
  });

  it("real deletion with --yes deletes only verified AgentInspect traces", async () => {
    const now = Date.now();
    await writeTrace(traceDir, "run_del_1", "d1", now - 30_000);
    await writeTrace(traceDir, "run_keep_1", "k1", now - 10_000);

    // Arbitrary JSONL (should not be deleted)
    await writeFile(path.join(traceDir, "other.jsonl"), jsonl(JSON.stringify({ hello: "world" })));
    // Malformed JSONL (should not be deleted)
    await writeFile(path.join(traceDir, "malformed.jsonl"), "{{{ not json\n", "utf-8");
    // Plain text (should not be deleted)
    await writeFile(path.join(traceDir, "notes.txt"), "hello", "utf-8");

    await clean({ dir: traceDir, keep: "1", yes: true });

    const files = await readdir(traceDir);
    expect(files).toContain("run_keep_1.jsonl");
    expect(files).not.toContain("run_del_1.jsonl");
    expect(files).toContain("other.jsonl");
    expect(files).toContain("malformed.jsonl");
    expect(files).toContain("notes.txt");
  });

  it("missing directory handled gracefully", async () => {
    const missing = path.join(traceDir, "does-not-exist");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await clean({ dir: missing, keep: "1", dryRun: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("No runs to clean");
    logSpy.mockRestore();
  });

  it("invalid --older-than fails clearly", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await clean({ dir: traceDir, olderThan: "nope", dryRun: true });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("Invalid duration"))).toBe(true);
    errSpy.mockRestore();
  });

  it("invalid --keep fails clearly", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await clean({ dir: traceDir, keep: "0", dryRun: true });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("Invalid --keep"))).toBe(true);
    errSpy.mockRestore();
  });

  it("AGENT_INSPECT_TRACE_DIR is used when --dir missing", async () => {
    process.env.AGENT_INSPECT_TRACE_DIR = traceDir;
    const now = Date.now();
    await writeTrace(traceDir, "run_env_clean", "env", now - 30_000);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await clean({ keep: "1", dryRun: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("No runs to clean");
    logSpy.mockRestore();
  });

  it("--dir overrides AGENT_INSPECT_TRACE_DIR", async () => {
    const otherDir = path.join(os.tmpdir(), `agent-inspect-cli-clean-other-${Date.now()}`);
    await mkdir(otherDir, { recursive: true });
    process.env.AGENT_INSPECT_TRACE_DIR = otherDir;

    const now = Date.now();
    await writeTrace(traceDir, "run_dir_override", "d", now - 30_000);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await clean({ dir: traceDir, keep: "1", dryRun: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("No runs to clean");
    logSpy.mockRestore();

    await rm(otherDir, { recursive: true, force: true });
  });

  it("confirmation cancellation deletes nothing", async () => {
    const now = Date.now();
    await writeTrace(traceDir, "run_c1", "c1", now - 30_000);
    await writeTrace(traceDir, "run_c2", "c2", now - 20_000);

    promptAnswer = "no";

    await clean({ dir: traceDir, keep: "1" });
    const files = await readdir(traceDir);
    expect(files).toContain("run_c1.jsonl");
    expect(files).toContain("run_c2.jsonl");
  });

  it("non-interactive without --yes fails safely", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
    const now = Date.now();
    await writeTrace(traceDir, "run_ni_1", "n1", now - 30_000);
    await writeTrace(traceDir, "run_ni_2", "n2", now - 20_000);

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await clean({ dir: traceDir, keep: "1" });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("Refusing"))).toBe(true);
    const files = await readdir(traceDir);
    expect(files).toContain("run_ni_1.jsonl");
    expect(files).toContain("run_ni_2.jsonl");
    errSpy.mockRestore();
  });

  it("skips non-AgentInspect files and does not delete them", async () => {
    await writeFile(path.join(traceDir, "other.jsonl"), jsonl(JSON.stringify({ hello: "world" })));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await clean({ dir: traceDir, keep: "1", dryRun: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("No runs to clean");
    logSpy.mockRestore();

    const raw = await readFile(path.join(traceDir, "other.jsonl"), "utf-8");
    expect(raw).toContain("hello");
  });
});

