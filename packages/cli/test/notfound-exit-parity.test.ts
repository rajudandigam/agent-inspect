import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { diffCommand } from "../src/diff.js";
import { exportCommand } from "../src/export.js";
import { explainCommand } from "../src/explain.js";
import { list } from "../src/list.js";
import { openCommand } from "../src/open.js";
import { reportCommand } from "../src/report.js";
import { searchCommand } from "../src/search.js";
import { sessionCommand } from "../src/sessions.js";
import { timelineCommand } from "../src/timeline.js";
import { view } from "../src/view.js";
import { whatCommand } from "../src/what.js";

function jsonl(...lines: string[]): string {
  return lines.join("\n") + "\n";
}

function syntheticTrace(runId: string, sessionId?: string): string {
  return jsonl(
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1_700_000_000_000,
      runId,
      name: runId,
      startTime: 1_700_000_000_000,
      ...(sessionId !== undefined ? { metadata: { sessionId } } : {}),
    }),
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 1_700_000_000_100,
      runId,
      status: "success",
      endTime: 1_700_000_000_100,
      durationMs: 100,
    }),
  );
}

/**
 * Cross-command parity contract (#105): a missing explicitly requested
 * resource exits nonzero in human AND JSON modes; empty list/search results
 * remain successful. Each case runs the real command function against a
 * synthetic temp trace directory.
 */
describe("not-found exit-code parity", () => {
  let traceDir: string;
  let traceFile: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;
  const prevExitCode = process.exitCode;

  beforeEach(async () => {
    traceDir = path.join(
      os.tmpdir(),
      `agent-inspect-parity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    );
    await mkdir(traceDir, { recursive: true });
    traceFile = path.join(traceDir, "existing-run.jsonl");
    await writeFile(traceFile, syntheticTrace("existing-run", "sess-known"), "utf-8");
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.exitCode = 0;
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    process.exitCode = prevExitCode ?? 0;
    await rm(traceDir, { recursive: true, force: true });
  });

  type Case = { name: string; run: (json: boolean) => Promise<void> };

  const lookupCases: Case[] = [
    {
      name: "view",
      run: (json) => view("missing-run", { dir: traceDir, json }),
    },
    {
      name: "report",
      run: (json) => reportCommand("missing-run", { dir: traceDir, json }),
    },
    {
      name: "timeline",
      run: (json) => timelineCommand("missing-run", { dir: traceDir, json }),
    },
    {
      name: "what",
      run: (json) => whatCommand("missing-run", { dir: traceDir, json }),
    },
    {
      name: "export",
      run: (json) => exportCommand("missing-run", { dir: traceDir, json }),
    },
    {
      name: "diff (missing left)",
      run: (json) => diffCommand("missing-run", "existing-run", { dir: traceDir, json }),
    },
    {
      name: "diff (missing right)",
      run: (json) => diffCommand("existing-run", "missing-run", { dir: traceDir, json }),
    },
    {
      name: "session",
      run: (json) => sessionCommand("sess-missing", { dir: traceDir, json }),
    },
    {
      name: "search --session",
      run: (json) => searchCommand({ dir: traceDir, session: "sess-missing", json }),
    },
  ];

  for (const { name, run } of lookupCases) {
    it(`${name}: missing resource exits nonzero in human mode`, async () => {
      await run(false);
      expect(process.exitCode).toBe(1);
    });

    it(`${name}: missing resource exits nonzero in JSON mode`, async () => {
      await run(true);
      expect(process.exitCode).toBe(1);
    });
  }

  it("explain --run: missing run exits nonzero in human and JSON modes", async () => {
    await explainCommand(traceFile, { run: "missing-run" });
    expect(process.exitCode).toBe(1);

    process.exitCode = 0;
    await explainCommand(traceFile, { run: "missing-run", json: true });
    expect(process.exitCode).toBe(1);
  });

  it("open --run: missing run exits nonzero in human and JSON modes", async () => {
    await openCommand(traceFile, { run: "missing-run" });
    expect(process.exitCode).toBe(1);

    process.exitCode = 0;
    await openCommand(traceFile, { run: "missing-run", json: true });
    expect(process.exitCode).toBe(1);
  });

  it("found resources still exit zero (control)", async () => {
    await view("existing-run", { dir: traceDir });
    expect(process.exitCode).toBe(0);

    await sessionCommand("sess-known", { dir: traceDir, json: true });
    expect(process.exitCode).toBe(0);
  });

  it("empty list results remain success in human and JSON modes", async () => {
    await list({ dir: traceDir, name: "zzz-no-match" });
    expect(process.exitCode).toBe(0);

    await list({ dir: traceDir, name: "zzz-no-match", json: true });
    expect(process.exitCode).toBe(0);
  });

  it("empty search results remain success in human and JSON modes", async () => {
    await searchCommand({ dir: traceDir, name: "zzz-no-match" });
    expect(process.exitCode).toBe(0);

    await searchCommand({ dir: traceDir, name: "zzz-no-match", json: true });
    expect(process.exitCode).toBe(0);
  });
});
