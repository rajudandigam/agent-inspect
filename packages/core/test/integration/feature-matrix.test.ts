import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { diffRuns } from "../../src/diff/engine.js";
import { manualTraceEventsToComparableRun } from "../../src/diff/comparable.js";
import { extractMetadata } from "../../src/trace-metadata.js";
import { exportRunTree, mergeExportDefaults, validateExport } from "../../src/exporters/index.js";
import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";
import { LiveLogAccumulator } from "../../src/logs/live-tree.js";
import { mergeLogIngestConfig } from "../../src/logs/config.js";
import { parseLogsToTrees } from "../../src/logs/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function trace(rel: string) {
  const raw = fs.readFileSync(path.join(repoRoot, rel), "utf8");
  return raw
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l));
}

describe("feature matrix (fixtures, no network)", () => {
  it("manual trace -> metadata extraction", async () => {
    const fp = path.join(repoRoot, "fixtures/traces/minimal-success.jsonl");
    const meta = await extractMetadata(fp);
    expect(meta.runId).toBe("minimal-success");
  });

  it("manual trace -> run tree -> markdown export validates", () => {
    const tree = manualTraceEventsToRunTree(trace("fixtures/traces/nested-3-levels.jsonl"));
    const md = exportRunTree(tree, mergeExportDefaults({ format: "markdown" }));
    expect(validateExport(md).ok).toBe(true);
  });

  it("manual trace diff vs error fixture", () => {
    const left = manualTraceEventsToComparableRun(trace("fixtures/traces/minimal-success.jsonl"));
    const right = manualTraceEventsToComparableRun(trace("fixtures/traces/minimal-error.jsonl"));
    const out = diffRuns(left, right);
    expect(out.differences.length).toBeGreaterThan(0);
  });

  it("JSON log fixture -> parseLogsToTrees", async () => {
    const res = await parseLogsToTrees(path.join(repoRoot, "fixtures/logs/proactive-json.log"), {
      format: "json",
      configPath: path.join(repoRoot, "fixtures/configs/proactive-agent-inspect.logs.json"),
    });
    expect(res.trees.length).toBeGreaterThan(0);
  });

  it("log4js fixture -> parseLogsToTrees", async () => {
    const res = await parseLogsToTrees(path.join(repoRoot, "fixtures/logs/proactive-log4js.log"), {
      format: "log4js",
      configPath: path.join(repoRoot, "fixtures/configs/proactive-agent-inspect.logs.json"),
    });
    expect(res.events.length).toBeGreaterThan(0);
  });

  it("live accumulator agrees with batch parse for JSON fixture", async () => {
    const logPath = path.join(repoRoot, "fixtures/logs/proactive-json.log");
    const cfg = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "fixtures/configs/proactive-agent-inspect.logs.json"), "utf8"),
    );
    const merged = mergeLogIngestConfig(cfg, {});
    const acc = new LiveLogAccumulator({ config: merged, format: "json", file: logPath });
    let n = 0;
    for (const line of fs.readFileSync(logPath, "utf8").split(/\r?\n/)) {
      if (line.trim() === "") continue;
      n += 1;
      acc.pushLine(line, n);
    }
    const batch = await parseLogsToTrees(logPath, {
      format: "json",
      configPath: path.join(repoRoot, "fixtures/configs/proactive-agent-inspect.logs.json"),
    });
    expect(acc.getEvents().length).toBe(batch.events.length);
  });

  it("OpenInference + OTLP exports validate from fixture tree", () => {
    const tree = manualTraceEventsToRunTree(trace("fixtures/traces/llm-with-tokens.jsonl"));
    expect(
      validateExport(exportRunTree(tree, mergeExportDefaults({ format: "openinference" }))).ok,
    ).toBe(true);
    expect(
      validateExport(exportRunTree(tree, mergeExportDefaults({ format: "otlp-json" }))).ok,
    ).toBe(true);
  });
});
