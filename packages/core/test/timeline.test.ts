import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildRunTimeline, renderTimeline } from "../src/timeline.js";

const fixturesDir = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../fixtures/traces",
);

async function loadFixture(name: string) {
  const raw = await readFile(path.join(fixturesDir, name), "utf-8");
  return raw
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l));
}

describe("buildRunTimeline", () => {
  it("orders steps chronologically", async () => {
    const events = await loadFixture("minimal-success.jsonl");
    const timeline = buildRunTimeline(events);
    expect(timeline.entries).toHaveLength(1);
    expect(timeline.entries[0]?.name).toBe("plan");
    expect(timeline.entries[0]?.offsetMs).toBe(10);
    expect(timeline.entries[0]?.durationMs).toBe(100);
  });

  it("detects error steps", async () => {
    const events = await loadFixture("minimal-error.jsonl");
    const timeline = buildRunTimeline(events);
    expect(timeline.status).toBe("error");
    expect(timeline.entries[0]?.isError).toBe(true);
  });

  it("marks tool and llm step types", async () => {
    const events = await loadFixture("tool-with-io.jsonl");
    const timeline = buildRunTimeline(events);
    expect(timeline.entries[0]?.type).toBe("tool");
  });

  it("marks slow focus on longest steps", async () => {
    const events = await loadFixture("tool-with-io.jsonl");
    const timeline = buildRunTimeline(events, { focus: "slow", slowTopN: 1 });
    expect(timeline.entries[0]?.slow).toBe(true);
    const text = renderTimeline(timeline, { focus: "slow" });
    expect(text).toContain("[slow]");
  });

  it("includes streaming metadata when present", async () => {
    const events = await loadFixture("minimal-success.jsonl");
    (events[1] as { metadata?: Record<string, unknown> }).metadata = {
      chunkCount: 3,
      streamDurationMs: 120,
    };
    const timeline = buildRunTimeline(events);
    expect(timeline.entries[0]?.streaming?.chunkCount).toBe(3);
  });

  it("handles missing optional fields", async () => {
    const timeline = buildRunTimeline([]);
    expect(timeline.runId).toBe("unknown-run");
    expect(timeline.entries).toEqual([]);
  });
});
