import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { diffRuns } from "../../src/diff/engine.js";
import { manualTraceEventsToComparableRun } from "../../src/diff/comparable.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function load(rel: string) {
  const raw = fs.readFileSync(path.join(repoRoot, rel), "utf8");
  return raw
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l));
}

describe("diff (pre-v1.0 conformance)", () => {
  it("identical comparable runs produce no differences", () => {
    const events = load("fixtures/traces/minimal-success.jsonl");
    const a = manualTraceEventsToComparableRun(events);
    const snap = JSON.stringify(a);
    const out = diffRuns(a, JSON.parse(snap) as typeof a);
    expect(out.differences).toHaveLength(0);
  });

  it("first divergence is defined when traces differ", () => {
    const left = manualTraceEventsToComparableRun(load("fixtures/traces/minimal-success.jsonl"));
    const right = manualTraceEventsToComparableRun(load("fixtures/traces/minimal-error.jsonl"));
    const out = diffRuns(left, right);
    expect(out.summary.firstDivergence).toBeDefined();
    expect(out.differences.length).toBeGreaterThan(0);
  });

  it("does not mutate comparable inputs", () => {
    const left = manualTraceEventsToComparableRun(load("fixtures/traces/minimal-success.jsonl"));
    const right = manualTraceEventsToComparableRun(load("fixtures/traces/minimal-error.jsonl"));
    const bs = JSON.stringify(left);
    const br = JSON.stringify(right);
    diffRuns(left, right);
    expect(JSON.stringify(left)).toBe(bs);
    expect(JSON.stringify(right)).toBe(br);
  });
});
