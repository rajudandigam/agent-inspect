import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectRun, step } from "agent-inspect";

import {
  createTraceDirectoryIndexer,
  defineIndexer,
  indexIsStale,
  shouldInvalidateIndex,
} from "../src/index.js";

describe("trace indexer contract", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-indexer-"));
    await inspectRun(
      "indexer-run",
      async () => {
        await step.tool("search", async () => "ok");
      },
      { traceDir },
    );
  });

  afterEach(async () => {
    await rm(traceDir, { recursive: true, force: true });
  });

  it("rebuilds a derived index from trace directory metadata", async () => {
    const indexer = createTraceDirectoryIndexer();
    const snapshot = await indexer.rebuild(traceDir);

    expect(snapshot.traceDir).toBe(traceDir);
    expect(snapshot.entries.length).toBeGreaterThan(0);
    expect(snapshot.entries[0]?.runId).toBeTruthy();
    expect(snapshot.builtAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("applies invalidation policy helpers", async () => {
    const indexer = createTraceDirectoryIndexer();
    const snapshot = await indexer.rebuild(traceDir);

    expect(
      shouldInvalidateIndex(snapshot, {
        invalidateBefore: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).toBe(true);

    expect(
      shouldInvalidateIndex(snapshot, {
        invalidateBefore: new Date(Date.now() - 60_000).toISOString(),
      }),
    ).toBe(false);

    expect(await indexIsStale(snapshot, traceDir)).toBe(false);
  });

  it("supports custom indexer definitions", async () => {
    const custom = defineIndexer({
      id: "empty",
      async rebuild(dir) {
        return {
          traceDir: dir,
          builtAt: new Date().toISOString(),
          entries: [],
          warnings: [],
        };
      },
    });
    const snapshot = await custom.rebuild(traceDir);
    expect(snapshot.entries).toEqual([]);
  });
});
