import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { inspectRun, observeOutcome } from "../src/index.js";

describe("observeOutcome", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-outcome-"));
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it("writes outcome_observed events inside inspectRun", async () => {
    await inspectRun(
      "outcome-api",
      async () => {
        await observeOutcome("queueJobCreated", {
          expectation: "Queue should contain job-42",
          status: "passed",
          method: "queue",
          evidence: { jobId: "job-42" },
        });
      },
      { silent: true, traceDir: tmp },
    );

    const files = await readdir(tmp);
    const traceFile = files.find((file) => file.endsWith(".jsonl"));
    expect(traceFile).toBeDefined();
    const content = await readFile(path.join(tmp, traceFile!), "utf-8");
    expect(content).toContain("outcome_observed");
    expect(content).toContain("queueJobCreated");
  });
});
