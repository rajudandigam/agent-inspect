import { access, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { parseTraceListJson } from "../src/cli.js";
import { discoverTraceDirs, findTraceHints, pickPrimaryTraceDir } from "../src/traceDirs.js";

describe("vscode traceDirs", () => {
  let tmpRoot: string;
  const originalEnv = process.env.AGENT_INSPECT_TRACE_DIR;

  beforeEach(async () => {
    tmpRoot = await mkdtemp(path.join(os.tmpdir(), "ai-vscode-"));
  });

  afterEach(async () => {
    if (originalEnv === undefined) delete process.env.AGENT_INSPECT_TRACE_DIR;
    else process.env.AGENT_INSPECT_TRACE_DIR = originalEnv;
  });

  it("prefers env trace dir when set and readable", async () => {
    const custom = path.join(tmpRoot, "custom-traces");
    await access(tmpRoot); // ensure parent exists
    const { mkdir } = await import("node:fs/promises");
    await mkdir(custom, { recursive: true });
    const dirs = await discoverTraceDirs(tmpRoot, { AGENT_INSPECT_TRACE_DIR: "custom-traces" });
    expect(dirs.some((d) => d.source === "env" && d.path === custom)).toBe(true);
    expect(pickPrimaryTraceDir(dirs)).toBe(custom);
  });

  it("always includes a default candidate", async () => {
    const dirs = await discoverTraceDirs(tmpRoot, {});
    expect(dirs.at(-1)?.source).toBe("default");
    expect(dirs.at(-1)?.path).toBe(path.join(tmpRoot, ".agent-inspect"));
  });

  it("finds run id hints in editor text", () => {
    expect(findTraceHints("failed run_run_abc123xyz in .agent-inspect")).toEqual({
      runId: "run_run_abc123xyz",
      traceDir: ".agent-inspect",
    });
  });
});

describe("vscode cli parsing", () => {
  it("parses list --json output", () => {
    const rows = parseTraceListJson(
      JSON.stringify([
        { runId: "run_a", name: "demo", status: "success", durationMs: 12 },
        { runId: "run_b", status: "error" },
      ]),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.runId).toBe("run_a");
    expect(rows[1]?.status).toBe("error");
  });

  it("returns empty array for blank stdout", () => {
    expect(parseTraceListJson("")).toEqual([]);
  });
});
