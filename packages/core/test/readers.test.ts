import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  TraceReadError,
  agentInspectJsonlReader,
  detectTraceFormat,
  openTrace,
  readTrace,
  type TraceReader,
} from "../src/readers/index.js";

const repoRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../..",
);

function toyReader(overrides: Partial<TraceReader> = {}): TraceReader {
  return {
    format: "toy-json",
    name: "Toy JSON",
    detect(input) {
      if (input.type !== "string") return undefined;
      if (!input.content.trim().startsWith("toy:")) return undefined;
      return {
        format: "toy-json",
        confidence: 0.9,
        readerName: "Toy JSON",
      };
    },
    read(input) {
      if (input.type !== "string") {
        throw new Error("toy reader expects string input");
      }
      return {
        format: "toy-json",
        events: [],
        runs: [],
        warnings: [],
        unsupportedFields: [],
        sourceFiles: [],
      };
    },
    ...overrides,
  };
}

describe("trace reader contract", () => {
  it("detects a matching custom reader deterministically", async () => {
    const detection = await detectTraceFormat(
      { type: "string", content: "toy:{\"ok\":true}" },
      { readers: [toyReader()] },
    );

    expect(detection).toMatchObject({
      status: "detected",
      format: "toy-json",
      candidates: [
        expect.objectContaining({
          format: "toy-json",
          confidence: 0.9,
          readerName: "Toy JSON",
        }),
      ],
    });
  });

  it("supports explicit format override without probing arbitrary input", async () => {
    const reader = toyReader({
      detect() {
        throw new Error("detect should not run for explicit format");
      },
    });

    const detection = await detectTraceFormat(
      { type: "string", content: "not toy" },
      { format: "toy-json", readers: [reader] },
    );

    expect(detection).toMatchObject({
      status: "detected",
      format: "toy-json",
      candidates: [
        expect.objectContaining({
          confidence: 1,
          description: "Explicit format override",
        }),
      ],
    });
  });

  it("reports unsupported inputs conservatively", async () => {
    const detection = await detectTraceFormat(
      { type: "string", content: "{\"arbitrary\":true}" },
      { readers: [toyReader()] },
    );

    expect(detection).toEqual({
      status: "unsupported",
      candidates: [],
      warnings: [],
    });
  });

  it("reports ambiguity when readers tie on confidence", async () => {
    const first = toyReader({
      format: "first",
      detect() {
        return { format: "first", confidence: 0.8 };
      },
    });
    const second = toyReader({
      format: "second",
      detect() {
        return { format: "second", confidence: 0.8 };
      },
    });

    const detection = await detectTraceFormat(
      { type: "string", content: "toy" },
      { readers: [second, first] },
    );

    expect(detection.status).toBe("ambiguous");
    expect(detection.candidates.map((candidate) => candidate.format)).toEqual([
      "first",
      "second",
    ]);
  });

  it("reports ambiguity when top candidates are close in confidence", async () => {
    const first = toyReader({
      format: "first",
      detect() {
        return { format: "first", confidence: 0.91 };
      },
    });
    const second = toyReader({
      format: "second",
      detect() {
        return { format: "second", confidence: 0.88 };
      },
    });

    const detection = await detectTraceFormat(
      { type: "string", content: "toy" },
      { readers: [first, second] },
    );

    expect(detection.status).toBe("ambiguous");
    expect(detection.warnings.map((warning) => warning.code)).toContain(
      "ambiguous_format_candidates",
    );
  });

  it("ignores low-confidence candidates", async () => {
    const reader = toyReader({
      detect() {
        return { format: "toy-json", confidence: 0.2 };
      },
    });

    const detection = await detectTraceFormat(
      { type: "string", content: "toy" },
      { readers: [reader] },
    );

    expect(detection.status).toBe("unsupported");
    expect(detection.warnings).toEqual([
      expect.objectContaining({ code: "low_confidence_candidates" }),
    ]);
  });

  it("reads with the detected reader and preserves detection warnings", async () => {
    const reader = toyReader({
      detect() {
        return {
          format: "toy-json",
          confidence: 0.9,
          warnings: [
            {
              code: "toy_warning",
              message: "toy detection warning",
              severity: "warning",
            },
          ],
        };
      },
      read() {
        return {
          format: "toy-json",
          events: [],
          runs: [],
          warnings: [
            {
              code: "toy_read_warning",
              message: "toy read warning",
              severity: "info",
            },
          ],
          unsupportedFields: ["toy.unsupported"],
          sourceFiles: ["inline"],
        };
      },
    });

    const result = await readTrace(
      { type: "string", content: "toy" },
      { readers: [reader] },
    );

    expect(result).toMatchObject({
      format: "toy-json",
      unsupportedFields: ["toy.unsupported"],
      sourceFiles: ["inline"],
    });
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      "toy_warning",
      "toy_read_warning",
    ]);
  });

  it("aliases openTrace to readTrace", async () => {
    const result = await openTrace(
      { type: "string", content: "toy:value" },
      { readers: [toyReader()] },
    );

    expect(result.format).toBe("toy-json");
  });

  it("throws typed errors for unsupported and ambiguous reads", async () => {
    await expect(
      readTrace(
        { type: "string", content: "nope" },
        { readers: [toyReader()] },
      ),
    ).rejects.toMatchObject({
      name: "TraceReadError",
      code: "unsupported_format",
    });

    await expect(
      readTrace(
        { type: "string", content: "toy" },
        {
          readers: [
            toyReader({
              format: "first",
              detect: () => ({ format: "first", confidence: 1 }),
            }),
            toyReader({
              format: "second",
              detect: () => ({ format: "second", confidence: 1 }),
            }),
          ],
        },
      ),
    ).rejects.toBeInstanceOf(TraceReadError);
  });
});

describe("AgentInspect JSONL reader", () => {
  it("detects and reads v0.1 JSONL fixtures by default", async () => {
    const filePath = path.join(repoRoot, "fixtures/traces/minimal-success.jsonl");

    const detection = await detectTraceFormat({ type: "file", path: filePath });
    const result = await readTrace({ type: "file", path: filePath });

    expect(detection).toMatchObject({
      status: "detected",
      format: "agent-inspect-jsonl",
    });
    expect(detection.candidates[0]?.description).toBe("agent-inspect-v0.1-jsonl");
    expect(result).toMatchObject({
      format: "agent-inspect-v0.1-jsonl",
      sourceFiles: [filePath],
    });
    expect(result.events).toHaveLength(4);
    expect(result.runs).toHaveLength(1);
    expect(result.runs[0]?.runId).toBe("minimal-success");
  });

  it("detects and reads v0.2 JSONL fixtures by default", async () => {
    const filePath = path.join(
      repoRoot,
      "fixtures/traces-v0.2/llm-tokens-and-streaming.jsonl",
    );

    const detection = await detectTraceFormat({ type: "file", path: filePath });
    const result = await openTrace({ type: "file", path: filePath });

    expect(detection.candidates[0]?.description).toBe("agent-inspect-v0.2-jsonl");
    expect(result.format).toBe("agent-inspect-v0.2-jsonl");
    expect(result.events).toHaveLength(3);
    expect(result.events.find((event) => event.kind === "LLM")?.tokenUsage).toEqual({
      input: 1200,
      output: 356,
      total: 1556,
      cached: 240,
    });
    expect(result.runs).toHaveLength(1);
  });

  it("supports buffer input", async () => {
    const content = [
      '{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"buffer_run","name":"buffer","startTime":1}',
      '{"schemaVersion":"0.1","event":"run_completed","timestamp":2,"runId":"buffer_run","status":"success","endTime":2,"durationMs":1}',
    ].join("\n");

    const result = await readTrace({
      type: "buffer",
      content: Buffer.from(content, "utf-8"),
    });

    expect(result.format).toBe("agent-inspect-v0.1-jsonl");
    expect(result.runs[0]?.runId).toBe("buffer_run");
  });

  it("reads sorted JSONL files from a directory", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-reader-"));
    const first = path.join(dir, "a.jsonl");
    const second = path.join(dir, "b.jsonl");
    await writeFile(
      second,
      '{"schemaVersion":"0.1","event":"run_completed","timestamp":2,"runId":"dir_run","status":"success","endTime":2,"durationMs":1}\n',
      "utf-8",
    );
    await writeFile(
      first,
      '{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"dir_run","name":"dir","startTime":1}\n',
      "utf-8",
    );

    const result = await readTrace({ type: "directory", path: dir });

    expect(result.sourceFiles).toEqual([first, second]);
    expect(result.runs[0]?.runId).toBe("dir_run");
  });

  it("does not silently accept arbitrary JSON", async () => {
    const detection = await detectTraceFormat({
      type: "string",
      content: '{"hello":"world"}',
    });

    expect(detection).toEqual({
      status: "unsupported",
      candidates: [],
      warnings: [],
    });
    await expect(
      readTrace({ type: "string", content: '{"hello":"world"}' }),
    ).rejects.toMatchObject({
      code: "unsupported_format",
    });
  });

  it("allows explicit AgentInspect reader selection", async () => {
    const result = await readTrace(
      {
        type: "string",
        content:
          '{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"override","name":"override","startTime":1}',
      },
      {
        format: agentInspectJsonlReader.format,
      },
    );

    expect(result.events).toHaveLength(1);
    expect(result.format).toBe("agent-inspect-v0.1-jsonl");
  });

  it("preserves native v0.2 rows when reading mixed AgentInspect JSONL", async () => {
    const content = [
      '{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"mixed_reader","name":"mixed","startTime":1}',
      '{"schemaVersion":"0.2","eventId":"native_tool","runId":"mixed_reader","kind":"TOOL","name":"native-tool","status":"running","timestamp":"2023-11-14T22:13:20.000Z","confidence":"explicit","source":{"type":"adapter","name":"native"},"attributes":{"custom":{"kept":true}},"trace":{"traceId":"trace-1","spanId":"span-1"}}',
      '{"schemaVersion":"0.1","event":"run_completed","timestamp":2,"runId":"mixed_reader","status":"success","endTime":2,"durationMs":1}',
    ].join("\n");

    const result = await readTrace({ type: "string", content });

    expect(result.format).toBe("agent-inspect-mixed-jsonl");
    expect(result.warnings.map((warning) => warning.code)).toContain(
      "mixed_agent_inspect_jsonl",
    );
    expect(result.events.map((event) => event.eventId)).toEqual([
      expect.stringContaining("run_started"),
      "native_tool",
      expect.stringContaining("run_completed"),
    ]);
    expect(result.events[1]).toMatchObject({
      eventId: "native_tool",
      source: { type: "adapter", name: "native" },
      attributes: { custom: { kept: true } },
      trace: { traceId: "trace-1", spanId: "span-1" },
    });
  });

  it("returns structured warnings for oversized input", async () => {
    const oversized = "x".repeat(10 * 1024 * 1024 + 1);

    const detection = await detectTraceFormat({
      type: "string",
      content: oversized,
    });

    expect(detection).toMatchObject({
      status: "unsupported",
      warnings: [expect.objectContaining({ code: "input_too_large" })],
    });

    await expect(
      readTrace({ type: "string", content: oversized }),
    ).rejects.toMatchObject({
      code: "unsupported_format",
      warnings: [expect.objectContaining({ code: "input_too_large" })],
    });
  });
});
