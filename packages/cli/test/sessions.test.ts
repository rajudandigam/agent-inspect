import { copyFile, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  sessionCommand,
  sessionsActivityCommand,
  sessionsCommand,
  sessionsErrorsCommand,
  sessionsHandoffsCommand,
  sessionsLatestCommand,
  sessionsShowCommand,
} from "../src/sessions.js";

const fixturesRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../fixtures/sessions",
);

async function copySessionFixtures(tmpDir: string): Promise<void> {
  const scenarios = [
    ["multi-agent-handoff", "handoff-planner.jsonl"],
    ["multi-agent-handoff", "handoff-worker.jsonl"],
    ["retry-attempts", "retry-run-1.jsonl"],
    ["retry-attempts", "retry-run-2.jsonl"],
  ] as const;

  for (const [scenario, file] of scenarios) {
    await copyFile(
      path.join(fixturesRoot, scenario, file),
      path.join(tmpDir, file),
    );
  }
}

describe("sessions CLI", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-sessions-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    process.exitCode = 0;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("lists sessions from fixture traces", async () => {
    await copySessionFixtures(tmpDir);
    await sessionsCommand({ dir: tmpDir });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("sess-handoff-001");
    expect(out).toContain("sess-retry-001");
  });

  it("emits JSON index", async () => {
    await copySessionFixtures(tmpDir);
    await sessionsCommand({ dir: tmpDir, json: true });
    const raw = logSpy.mock.calls.flat().join("");
    const parsed = JSON.parse(raw) as { sessions: Array<{ sessionId: string }> };
    expect(parsed.sessions.map((s) => s.sessionId).sort()).toEqual([
      "sess-handoff-001",
      "sess-retry-001",
    ]);
  });

  it("shows session handoffs", async () => {
    await copySessionFixtures(tmpDir);
    await sessionCommand("sess-handoff-001", { dir: tmpDir });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("handoff-planner");
    expect(out).toContain("handoff-worker");
    expect(out).toContain("Handoffs:");
  });

  it("reports missing session", async () => {
    await copySessionFixtures(tmpDir);
    await sessionCommand("missing-session", { dir: tmpDir });
    expect(process.exitCode).toBe(1);
    expect(logSpy.mock.calls.flat().join(" ")).toContain("Session not found");
  });

  it("includes critical path when requested", async () => {
    await copySessionFixtures(tmpDir);
    await sessionCommand("sess-handoff-001", {
      dir: tmpDir,
      criticalPath: true,
    });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("Critical path:");
  });

  it("emits JSON session view", async () => {
    await copySessionFixtures(tmpDir);
    await sessionCommand("sess-retry-001", { dir: tmpDir, json: true });
    const parsed = JSON.parse(logSpy.mock.calls.flat().join("")) as {
      session: { sessionId: string; retries: unknown[]; status: string };
    };
    expect(parsed.session.sessionId).toBe("sess-retry-001");
    expect(parsed.session.retries.length).toBeGreaterThan(0);
    expect(parsed.session.status).toBeDefined();
  });

  it("latest returns the most recent session", async () => {
    await copySessionFixtures(tmpDir);
    await sessionsLatestCommand({ dir: tmpDir, json: true });
    const parsed = JSON.parse(logSpy.mock.calls.flat().join("")) as {
      ok: boolean;
      session: { sessionId: string };
    };
    expect(parsed.ok).toBe(true);
    expect(parsed.session.sessionId).toMatch(/^sess-/);
  });

  it("activity emits JSON summary", async () => {
    await copySessionFixtures(tmpDir);
    await sessionsActivityCommand({ dir: tmpDir, json: true, since: "1000d" });
    const parsed = JSON.parse(logSpy.mock.calls.flat().join("")) as {
      ok: boolean;
      sessions: number;
      entries: unknown[];
    };
    expect(parsed.ok).toBe(true);
    expect(parsed.sessions).toBeGreaterThan(0);
  });

  it("handoffs lists edges for a session", async () => {
    await copySessionFixtures(tmpDir);
    await sessionsHandoffsCommand({
      dir: tmpDir,
      session: "sess-handoff-001",
      json: true,
    });
    const parsed = JSON.parse(logSpy.mock.calls.flat().join("")) as {
      count: number;
      handoffs: Array<{ from: string; to: string }>;
    };
    expect(parsed.count).toBeGreaterThan(0);
    expect(parsed.handoffs[0]?.from).toBeDefined();
  });

  it("show delegates to session view", async () => {
    await copySessionFixtures(tmpDir);
    await sessionsShowCommand("sess-handoff-001", { dir: tmpDir });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("sess-handoff-001");
    expect(out).toContain("Handoffs:");
  });

  it("errors reports empty when no failures", async () => {
    await copySessionFixtures(tmpDir);
    await sessionsErrorsCommand({ dir: tmpDir, since: "30d" });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("No error sessions");
  });
});
