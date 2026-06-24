import path from "node:path";

import { describe, expect, it } from "vitest";

import { extractMetadata } from "../src/trace-metadata.js";
import { parseDurationFilter, searchTraces } from "../src/search.js";

const fixturesDir = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../fixtures/traces",
);
const fixturesV02Dir = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../fixtures/traces-v0.2",
);

describe("searchTraces", () => {
  it("parses duration filters", () => {
    expect(parseDurationFilter(">5s")).toEqual({ op: ">", ms: 5000 });
  });

  it("finds error runs by status", async () => {
    const metas = [
      await extractMetadata(path.join(fixturesDir, "minimal-error.jsonl")),
    ];
    const results = await searchTraces(metas, {
      traceDir: fixturesDir,
      status: "error",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.runId === "minimal-error")).toBe(true);
  });

  it("finds tool steps by type", async () => {
    const metas = [
      await extractMetadata(path.join(fixturesDir, "tool-with-io.jsonl")),
    ];
    const results = await searchTraces(metas, {
      traceDir: fixturesDir,
      kind: "tool",
    });
    expect(results.some((r) => r.stepType === "tool")).toBe(true);
  });

  it("filters by duration comparator", async () => {
    const metas = [
      await extractMetadata(path.join(fixturesDir, "tool-with-io.jsonl")),
    ];
    const results = await searchTraces(metas, {
      traceDir: fixturesDir,
      duration: ">50ms",
    });
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns deterministic ordering", async () => {
    const metas = await Promise.all(
      ["minimal-success.jsonl", "minimal-error.jsonl"].map((f) =>
        extractMetadata(path.join(fixturesDir, f)),
      ),
    );
    const a = await searchTraces(metas, { traceDir: fixturesDir, limit: 10 });
    const b = await searchTraces(metas, { traceDir: fixturesDir, limit: 10 });
    expect(a).toEqual(b);
  });

  it("matches v0.1 and v0.2 step searches using exact file paths", async () => {
    const v01Meta = await extractMetadata(
      path.join(fixturesDir, "dual-format-parity.jsonl"),
    );
    const v02Meta = await extractMetadata(
      path.join(fixturesV02Dir, "dual-format-parity.jsonl"),
    );
    const options = {
      status: "success" as const,
      kind: "tool",
      tool: "fixture-search",
      duration: ">=500ms",
    };

    const v01 = await searchTraces([v01Meta], {
      traceDir: fixturesDir,
      ...options,
    });
    const v02 = await searchTraces([v02Meta], {
      traceDir: fixturesV02Dir,
      ...options,
    });

    for (const results of [v01, v02]) {
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        runId: "run_dual_format_parity",
        runName: "dual-format-parity",
        runStatus: "success",
        stepName: "fixture-search",
        stepType: "tool",
        durationMs: 500,
      });
    }
  });
});
