import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { JsonLogParser } from "../../src/logs/json-parser.js";
import { openTrace } from "../../src/entries/readers.js";

const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../fixtures/logs",
);

const parser = new JsonLogParser();

/**
 * Malformed final-line corpus (#107): interrupted writes must degrade with
 * warnings, never throw, and never drop or reorder earlier valid records.
 */
describe("malformed JSONL final-line corpus", () => {
  it("truncated final line warns and preserves prior records in order", async () => {
    const result = await parser.parseFile(path.join(fixturesDir, "tail-truncated-final.log"));

    expect(result.records).toHaveLength(3);
    expect(result.records.map((r) => r.line)).toEqual([1, 2, 3]);
    expect(result.records.map((r) => r.raw.event)).toEqual([
      "proactive.job.started",
      "proactive.tool.search",
      "proactive.result.done",
    ]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({ code: "MALFORMED_JSON", line: 4 });
  });

  it("missing trailing newline parses every line without warnings", async () => {
    const result = await parser.parseFile(path.join(fixturesDir, "tail-missing-newline.log"));

    expect(result.records).toHaveLength(3);
    expect(result.warnings).toEqual([]);
    expect(result.records[2]?.raw.event).toBe("proactive.job.completed");
  });

  it("partial JSON object at EOF warns and keeps prior records", async () => {
    const result = await parser.parseFile(path.join(fixturesDir, "tail-partial-object.log"));

    expect(result.records).toHaveLength(2);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({ code: "MALFORMED_JSON", line: 3 });
  });

  it("mixed valid/invalid tail keeps valid lines on both sides of the break", async () => {
    const result = await parser.parseFile(
      path.join(fixturesDir, "tail-mixed-valid-invalid.log"),
    );

    expect(result.records.map((r) => r.line)).toEqual([1, 2, 4]);
    expect(result.records[2]?.raw.event).toBe("proactive.job.completed");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({ code: "MALFORMED_JSON", line: 3 });
  });
});

describe("trace reader final-line degradation", () => {
  const validRow = (event: string, extra: string) =>
    `{"schemaVersion":"0.1","event":"${event}","timestamp":1,"runId":"tail-run",${extra}}`;

  it("truncated final trace row warns and preserves accepted events in order", async () => {
    const content = [
      validRow("run_started", '"name":"tail-run","startTime":1'),
      validRow("step_started", '"stepId":"s1","name":"step-one","type":"logic","startTime":2'),
      '{"schemaVersion":"0.1","event":"step_completed","timestamp":3,"runId":"tail-ru',
    ].join("\n");

    const read = await openTrace({ type: "string", content });

    expect(read.warnings.some((w) => w.code === "invalid_jsonl_rows" && w.line === 3)).toBe(
      true,
    );
    expect(read.events.map((e) => e.name)).toEqual(["tail-run", "step-one"]);
  });

  it("does not throw for a file that is only a partial object", async () => {
    const read = await openTrace(
      { type: "string", content: '{"schemaVersion":"0.1","event":"run_star' },
      { format: "agent-inspect-jsonl" },
    ).catch((error) => error as Error);

    // Either a warning-bearing empty read or a typed TraceReadError is
    // acceptable; an unhandled parser throw is not.
    if (read instanceof Error) {
      expect(read.name).toBe("TraceReadError");
    } else {
      expect(read.events).toEqual([]);
    }
  });

  it("missing trailing newline on the final trace row reads cleanly", async () => {
    const content =
      validRow("run_started", '"name":"tail-run","startTime":1') +
      "\n" +
      validRow("run_completed", '"status":"success","endTime":2,"durationMs":1');

    const read = await openTrace({ type: "string", content });

    expect(read.warnings.filter((w) => w.code === "invalid_jsonl_rows")).toEqual([]);
    expect(read.events).toHaveLength(2);
  });
});
