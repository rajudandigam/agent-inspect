import { describe, expect, it } from "vitest";

import path from "node:path";

import { parseLogsToTrees } from "../../src/logs/index.js";
import { renderRunTrees } from "../../src/logs/tree-renderer.js";

const jsonSample = path.resolve(
  process.cwd(),
  "examples/06-log-to-tree/sample-json.log",
);
const log4jsSample = path.resolve(
  process.cwd(),
  "examples/06-log-to-tree/sample-log4js.log",
);
const configPath = path.resolve(
  process.cwd(),
  "examples/06-log-to-tree/agent-inspect.logs.json",
);

describe("v0.3 production pipeline vs spike samples", () => {
  it("parses JSON sample into a run tree with expected markers", async () => {
    const res = await parseLogsToTrees(jsonSample, {
      format: "json",
      configPath,
    });
    expect(res.trees.length).toBeGreaterThanOrEqual(1);
    const t = res.trees.find((x) => x.runId === "01fe6bf1") ?? res.trees[0]!;
    expect(t.runId).toBe("01fe6bf1");

    const out = renderRunTrees([t], { summary: true, showConfidence: "always" });
    expect(out).toContain("Run");
    expect(out).toContain("job:started");
    expect(out).toContain("agent:started");
    expect(out).toContain("tool:get_conversation_history");
    expect(out).toContain("llm:generate_message");
    expect(out).toContain("result:");
    expect(out).toContain("confidence:");
    // prefix redaction markers from config
    expect(out).toContain("user=");
    expect(out).toContain("trip=");
  });

  it("parses log4js sample and preserves source type", async () => {
    const res = await parseLogsToTrees(log4jsSample, {
      format: "log4js",
      configPath,
    });
    expect(res.events.length).toBeGreaterThan(0);
    expect(res.events.some((e) => e.source.type === "log4js")).toBe(true);
  });
});

