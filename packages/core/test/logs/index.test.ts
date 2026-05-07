import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseLogsToTrees } from "../../src/logs/index.js";

describe("parseLogsToTrees", () => {
  it("parses JSON logs with config overrides and redaction", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-plt-"));
    const file = path.join(dir, "sample.log");
    await writeFile(
      file,
      JSON.stringify({
        decisionId: "d1",
        event: "proactive.job.started",
        timestamp: Date.now(),
        token: "secret",
      }) + "\n",
      "utf-8",
    );

    const res = await parseLogsToTrees(file, {
      format: "json",
      config: {
        runIdKeys: ["decisionId"],
        eventKey: "event",
        timestampKey: "timestamp",
        mappings: {
          "proactive.job.started": { kind: "RUN", name: "job:started", startsRun: true },
        },
        redact: ["token"],
      },
    });

    expect(res.events).toHaveLength(1);
    expect(res.trees).toHaveLength(1);
    expect(res.trees[0]!.runId).toBe("d1");
    expect(res.events[0]!.attributes?.token).toBe("[REDACTED]");

    await rm(dir, { recursive: true, force: true });
  });
});

