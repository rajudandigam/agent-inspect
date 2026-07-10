import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as core from "@agent-inspect/core/advanced";

import { list } from "../src/list.js";

function jsonl(...lines: string[]): string {
  return lines.join("\n") + "\n";
}

function runStarted(
  runId: string,
  name: string,
  startTime: number,
  timestamp: number,
): string {
  return JSON.stringify({
    schemaVersion: "0.1",
    event: "run_started",
    timestamp,
    runId,
    name,
    startTime,
  });
}

function runCompleted(
  runId: string,
  status: "success" | "error",
  endTime: number,
  durationMs: number,
  error?: { message: string; stack?: string },
): string {
  return JSON.stringify({
    schemaVersion: "0.1",
    event: "run_completed",
    timestamp: endTime,
    runId,
    status,
    endTime,
    durationMs,
    ...(error !== undefined ? { error } : {}),
  });
}

describe("list", () => {
  let traceDir: string;
  const prevEnv = process.env.AGENT_INSPECT_TRACE_DIR;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-cli-list-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
    delete process.env.AGENT_INSPECT_TRACE_DIR;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (prevEnv === undefined) {
      delete process.env.AGENT_INSPECT_TRACE_DIR;
    } else {
      process.env.AGENT_INSPECT_TRACE_DIR = prevEnv;
    }
  });

  it("prints empty state when no runs", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("No AgentInspect runs found");
    expect(out).toContain(traceDir);
    logSpy.mockRestore();
  });

  it("--json prints [] when no runs", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir, json: true });
    expect(String(logSpy.mock.calls[0]?.[0] ?? "")).toBe("[]");
    logSpy.mockRestore();
  });

  it("lists a successful run", async () => {
    const runId = "run_ok1";
    const body = jsonl(
      runStarted(runId, "my-run", 1000, 1000),
      runCompleted(runId, "success", 2000, 1000),
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Recent AgentInspect Runs");
    expect(out).toContain(runId);
    expect(out).toContain("my-run");
    expect(out).toContain("✓");
    expect(out).toContain("1.00s");
    logSpy.mockRestore();
  });

  it("lists a failed run", async () => {
    const runId = "run_err1";
    const body = jsonl(
      runStarted(runId, "bad-run", 500, 500),
      runCompleted(runId, "error", 600, 100, {
        message: "boom",
      }),
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain(runId);
    expect(out).toContain("bad-run");
    expect(out).toContain("✗");
    logSpy.mockRestore();
  });

  it("lists a running run", async () => {
    const runId = "run_live";
    const body = jsonl(runStarted(runId, "in-progress", 10, 10));
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain(runId);
    expect(out).toContain("in-progress");
    expect(out).toContain("⏳");
    logSpy.mockRestore();
  });

  it("filters by status", async () => {
    const ok = "run_okf";
    const bad = "run_badf";
    await writeFile(
      path.join(traceDir, `${ok}.jsonl`),
      jsonl(
        runStarted(ok, "ok", 100, 100),
        runCompleted(ok, "success", 200, 100),
      ),
      "utf-8",
    );
    await writeFile(
      path.join(traceDir, `${bad}.jsonl`),
      jsonl(
        runStarted(bad, "bad", 50, 50),
        runCompleted(bad, "error", 60, 10, { message: "e" }),
      ),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir, status: "error" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain(bad);
    expect(out).not.toContain(ok);
    logSpy.mockRestore();
  });

  it("filters by status unknown", async () => {
    const unknown = "run_unknown";
    // Missing run_started should yield unknown status in metadata.
    await writeFile(
      path.join(traceDir, `${unknown}.jsonl`),
      jsonl(JSON.stringify({ schemaVersion: "0.1", event: "step_started", runId: unknown })),
      "utf-8",
    );
    const ok = "run_ok_known";
    await writeFile(
      path.join(traceDir, `${ok}.jsonl`),
      jsonl(runStarted(ok, "ok", 100, 100), runCompleted(ok, "success", 200, 100)),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir, status: "unknown" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain(unknown);
    expect(out).not.toContain(ok);
    logSpy.mockRestore();
  });

  it("filters by --name matching runId and name", async () => {
    const runA = "run_hotel_1";
    const runB = "run_other_1";
    await writeFile(
      path.join(traceDir, `${runA}.jsonl`),
      jsonl(runStarted(runA, "hotel search", 100, 100), runCompleted(runA, "success", 200, 100)),
      "utf-8",
    );
    await writeFile(
      path.join(traceDir, `${runB}.jsonl`),
      jsonl(runStarted(runB, "flights", 100, 100), runCompleted(runB, "success", 200, 100)),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir, name: "hotel" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain(runA);
    expect(out).not.toContain(runB);
    logSpy.mockRestore();
  });

  it("filters by --since using startedAt when present", async () => {
    const oldRun = "run_old";
    const newRun = "run_new";
    const now = Date.now();
    await writeFile(
      path.join(traceDir, `${oldRun}.jsonl`),
      jsonl(runStarted(oldRun, "old", now - 3 * 60 * 60 * 1000, now - 3 * 60 * 60 * 1000)),
      "utf-8",
    );
    await writeFile(
      path.join(traceDir, `${newRun}.jsonl`),
      jsonl(runStarted(newRun, "new", now - 10 * 60 * 1000, now - 10 * 60 * 1000)),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir, since: "1h" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain(newRun);
    expect(out).not.toContain(oldRun);
    logSpy.mockRestore();
  });

  it("invalid --since sets non-zero exit code", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await list({ dir: traceDir, since: "nope" });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("list failed"))).toBe(true);
    errSpy.mockRestore();
  });

  it("--dir overrides AGENT_INSPECT_TRACE_DIR", async () => {
    const otherDir = path.join(os.tmpdir(), `agent-inspect-cli-list-other-${Date.now()}`);
    await mkdir(otherDir, { recursive: true });
    process.env.AGENT_INSPECT_TRACE_DIR = otherDir;

    const runId = "run_in_dir";
    await writeFile(
      path.join(traceDir, `${runId}.jsonl`),
      jsonl(runStarted(runId, "dir", 1, 1)),
      "utf-8",
    );

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain(runId);
    logSpy.mockRestore();

    await rm(otherDir, { recursive: true, force: true });
  });

  it("AGENT_INSPECT_TRACE_DIR is used when --dir missing", async () => {
    process.env.AGENT_INSPECT_TRACE_DIR = traceDir;
    const runId = "run_env";
    await writeFile(
      path.join(traceDir, `${runId}.jsonl`),
      jsonl(runStarted(runId, "env", 1, 1)),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({});
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain(runId);
    logSpy.mockRestore();
  });

  it("--json returns parseable array", async () => {
    const runId = "run_json_list";
    await writeFile(
      path.join(traceDir, `${runId}.jsonl`),
      jsonl(runStarted(runId, "j", 1, 1)),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir, json: true });
    const raw = String(logSpy.mock.calls[0]?.[0] ?? "");
    const parsed = JSON.parse(raw) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    logSpy.mockRestore();
  });

  it("lists v0.2 metadata from the embedded run", async () => {
    const fixture = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../fixtures/traces-v0.2/dual-format-parity.jsonl",
    );
    await cp(fixture, path.join(traceDir, "dual-format-parity.jsonl"));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await list({ dir: traceDir, json: true });

    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0])) as Array<
      Record<string, unknown>
    >;
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      runId: "run_dual_format_parity",
      name: "dual-format-parity",
      status: "success",
      durationMs: 1000,
      eventCount: 2,
    });
    logSpy.mockRestore();
  });

  it("respects limit", async () => {
    const ids = ["run_t3", "run_t2", "run_t1"];
    const times = [3000, 2000, 1000];
    for (let i = 0; i < 3; i++) {
      const id = ids[i]!;
      const t = times[i]!;
      await writeFile(
        path.join(traceDir, `${id}.jsonl`),
        jsonl(
          runStarted(id, `name-${id}`, t, t),
          runCompleted(id, "success", t + 1, 1),
        ),
        "utf-8",
      );
    }
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir, limit: "2" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    const dataLines = out
      .split("\n")
      .filter((l) => l.includes("run_t") && l.includes("|"));
    expect(dataLines.length).toBe(2);
    expect(out).toContain("run_t3");
    expect(out).toContain("run_t2");
    expect(out).not.toContain("run_t1");
    logSpy.mockRestore();
  });

  it("summary reports total matching runs when limit truncates", async () => {
    const ids = ["run_t3", "run_t2", "run_t1"];
    const times = [3000, 2000, 1000];
    for (let i = 0; i < 3; i++) {
      const id = ids[i]!;
      const t = times[i]!;
      await writeFile(
        path.join(traceDir, `${id}.jsonl`),
        jsonl(
          runStarted(id, `name-${id}`, t, t),
          runCompleted(id, "success", t + 1, 1),
        ),
        "utf-8",
      );
    }
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir, limit: "2" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Showing 2 of 3 runs");
    logSpy.mockRestore();
  });

  it("sets exit code when listTraceFiles fails unexpectedly", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(core.TraceDirectory.prototype, "list").mockRejectedValueOnce(
      new Error("disk"),
    );
    await list({ dir: traceDir });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("list failed"))).toBe(
      true,
    );
    errSpy.mockRestore();
  });

  it("skips malformed files and still lists valid runs", async () => {
    await writeFile(path.join(traceDir, "bad.jsonl"), "{{{ not json\n", "utf-8");
    const good = "run_good";
    await writeFile(
      path.join(traceDir, `${good}.jsonl`),
      jsonl(
        runStarted(good, "only-valid", 1, 1),
        runCompleted(good, "success", 2, 1),
      ),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await list({ dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain(good);
    expect(out).toContain("only-valid");
    logSpy.mockRestore();
  });
});
