import path from "node:path";

import { describe, expect, it } from "vitest";

import { extractMetadata } from "../src/trace-metadata.js";
import { parseDurationFilter, searchTraces } from "../src/search.js";

const fixturesDir = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../fixtures/traces",
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
});
