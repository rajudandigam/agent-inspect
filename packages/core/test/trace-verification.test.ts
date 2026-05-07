import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isAgentInspectTrace } from "../src/trace-verification.js";

describe("isAgentInspectTrace", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-verify-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns true for a valid AgentInspect trace (schemaVersion 0.1)", async () => {
    const fp = path.join(dir, "run_a.jsonl");
    await writeFile(
      fp,
      `${JSON.stringify({
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "run_a",
        name: "n",
        startTime: 1,
      })}\n`,
      "utf8",
    );
    expect(await isAgentInspectTrace(fp)).toBe(true);
  });

  it("returns false for arbitrary JSONL", async () => {
    const fp = path.join(dir, "x.jsonl");
    await writeFile(fp, `{"hello":"world"}\n{"n":1}\n`, "utf8");
    expect(await isAgentInspectTrace(fp)).toBe(false);
  });

  it("returns false for malformed file", async () => {
    const fp = path.join(dir, "x.jsonl");
    await writeFile(fp, `{bad json}\n`, "utf8");
    expect(await isAgentInspectTrace(fp)).toBe(false);
  });

  it("returns false for missing file", async () => {
    const fp = path.join(dir, "missing.jsonl");
    expect(await isAgentInspectTrace(fp)).toBe(false);
  });

  it("returns false for empty file", async () => {
    const fp = path.join(dir, "empty.jsonl");
    await writeFile(fp, "", "utf8");
    expect(await isAgentInspectTrace(fp)).toBe(false);
  });

  it("returns false for plain text file", async () => {
    const fp = path.join(dir, "x.txt");
    await writeFile(fp, "hello", "utf8");
    expect(await isAgentInspectTrace(fp)).toBe(false);
  });
});

