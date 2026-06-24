import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseTraceJsonl } from "../src/read-trace.js";
import { validateEvent } from "../src/storage.js";

describe("parseTraceJsonl", () => {
  it("reads v0.1 fixtures unchanged", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces/minimal-success.jsonl",
    );
    const raw = await readFile(fixture, "utf-8");
    const { format, sourceEventCount, events } = parseTraceJsonl(raw, {
      validate: validateEvent,
    });
    expect(format).toBe("0.1");
    expect(sourceEventCount).toBe(4);
    expect(events).toHaveLength(4);
  });

  it("normalizes v0.2 fixtures to trace events", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces-v0.2/llm-tokens-and-streaming.jsonl",
    );
    const raw = await readFile(fixture, "utf-8");
    const { format, sourceEventCount, events, persisted } = parseTraceJsonl(raw, {
      validate: validateEvent,
    });
    expect(format).toBe("0.2");
    expect(sourceEventCount).toBe(3);
    expect(persisted.length).toBeGreaterThan(0);
    const llm = events.find(
      (e) => e.event === "step_started" && e.type === "llm",
    );
    expect(llm && llm.event === "step_started" ? llm.metadata?.tokens : undefined).toEqual({
      input: 1200,
      output: 356,
    });
  });

  it("reports mixed format when both schema versions appear", () => {
    const raw = [
      '{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"r","name":"n","startTime":1}',
      '{"schemaVersion":"0.2","eventId":"e","runId":"r","kind":"RUN","name":"n","timestamp":"2023-11-14T22:13:20.000Z","confidence":"explicit","source":{"type":"manual"}}',
    ].join("\n");
    const { format, sourceEventCount, events } = parseTraceJsonl(raw, {
      validate: validateEvent,
    });
    expect(format).toBe("mixed");
    expect(sourceEventCount).toBe(2);
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  it("preserves source-row order and adjacent one-to-many expansion", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "fixtures/mixed-v0.1-v0.2-order.jsonl",
    );
    const raw = await readFile(fixture, "utf-8");
    const { format, sourceEventCount, events, persisted } = parseTraceJsonl(raw, {
      validate: validateEvent,
      warnings: false,
    });

    expect(format).toBe("mixed");
    expect(sourceEventCount).toBe(3);
    expect(persisted.map((event) => event.eventId)).toEqual(["mixed-tool"]);
    expect(events.map((event) => event.event)).toEqual([
      "run_started",
      "step_started",
      "step_completed",
      "run_completed",
    ]);
    expect(
      events.map((event) =>
        event.event === "step_started" ? event.name : event.event,
      ),
    ).toEqual([
      "run_started",
      "middle-tool",
      "step_completed",
      "run_completed",
    ]);
  });

  it("keeps valid mixed rows in place when an invalid line is skipped", () => {
    const raw = [
      '{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"r","name":"first","startTime":1}',
      "not-json",
      '{"schemaVersion":"0.2","eventId":"middle","runId":"r","kind":"TOOL","name":"middle","status":"running","timestamp":"2023-11-14T22:13:20.000Z","confidence":"explicit","source":{"type":"manual"}}',
      '{"schemaVersion":"0.1","event":"run_completed","timestamp":3,"runId":"r","status":"success","endTime":3,"durationMs":2}',
    ].join("\n");
    const { sourceEventCount, events } = parseTraceJsonl(raw, {
      validate: validateEvent,
      warnings: false,
    });

    expect(sourceEventCount).toBe(3);
    expect(events.map((event) => event.event)).toEqual([
      "run_started",
      "step_started",
      "run_completed",
    ]);
  });
});
