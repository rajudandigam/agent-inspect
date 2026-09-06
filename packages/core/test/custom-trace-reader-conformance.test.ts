import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { buildTraceFacts } from "../src/checks/trace-facts.js";
import { isPersistedInspectEvent } from "../src/types/persisted-inspect-event.js";
import {
  DEFAULT_TRACE_READERS,
  TraceReadError,
  openTrace,
  type TraceReader,
} from "../src/readers/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixturePath = path.join(
  repoRoot,
  "examples/recipes/external-persisted-session-reader/fixture/session.json",
);

async function loadRecipeReader(): Promise<TraceReader> {
  const mod = await import(
    path.join(
      repoRoot,
      "examples/recipes/external-persisted-session-reader/src/session-reader.ts",
    )
  );
  return mod.syntheticSessionReader as TraceReader;
}

describe("6.19 custom TraceReader conformance (synthetic session)", () => {
  it("reads the foreign fixture into persisted events and TraceFacts", async () => {
    const reader = await loadRecipeReader();
    const read = await openTrace(
      { type: "file", path: fixturePath },
      { readers: [reader, ...DEFAULT_TRACE_READERS] },
    );

    expect(read.format).toBe("synthetic-session-json");
    expect(read.events).toHaveLength(2);
    expect(read.events.every((event) => isPersistedInspectEvent(event))).toBe(true);
    expect(read.warnings.some((w) => w.code === "synthetic_session_unsupported_event_type")).toBe(
      true,
    );

    const facts = buildTraceFacts(read);
    expect(facts.summary.finishedToolNames).toContain("lookup_policy");
    expect(facts.logicalEvents.length).toBeGreaterThan(0);
  });

  it("rejects duplicate event ids deterministically", async () => {
    const reader = await loadRecipeReader();
    const base = JSON.parse(await readFile(fixturePath, "utf8")) as {
      sessionId: string;
      events: Array<Record<string, unknown>>;
    };
    base.events.push({ ...base.events[0], id: "event-1" });

    await expect(
      openTrace(
        { type: "string", content: JSON.stringify(base) },
        { format: "synthetic-session-json", readers: [reader] },
      ),
    ).rejects.toBeInstanceOf(TraceReadError);
  });

  it("fails clearly on malformed JSON", async () => {
    const reader = await loadRecipeReader();
    await expect(
      openTrace(
        { type: "string", content: "{not-json" },
        { format: "synthetic-session-json", readers: [reader] },
      ),
    ).rejects.toBeInstanceOf(TraceReadError);
  });
});
