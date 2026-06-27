import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  TraceReadError,
  agentInspectJsonlReader,
  detectTraceFormat,
  openInferenceJsonReader,
  openTrace,
  otlpJsonReader,
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

  it("detects and reads v1.0 JSONL fixtures by default", async () => {
    const filePath = path.join(repoRoot, "fixtures/traces-v1.0/manual-basic.jsonl");

    const detection = await detectTraceFormat({ type: "file", path: filePath });
    const result = await openTrace({ type: "file", path: filePath });

    expect(detection.candidates[0]?.description).toBe("agent-inspect-v1.0-jsonl");
    expect(result.format).toBe("agent-inspect-v1.0-jsonl");
    expect(result.events).toHaveLength(4);
    expect(result.events.map((event) => event.schemaVersion)).toEqual([
      "1.0",
      "1.0",
      "1.0",
      "1.0",
    ]);
    expect(
      result.events.find((event) => event.eventId === "logic_1") as Record<
        string,
        unknown
      >,
    ).toMatchObject({
      stableExtension: { fixture: "unknown-optional-field" },
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

describe("OpenInference JSON reader", () => {
  const basicFixture = path.join(
    repoRoot,
    "packages/core/test/fixtures/openinference-basic.json",
  );
  const malformedFixture = path.join(
    repoRoot,
    "packages/core/test/fixtures/openinference-malformed.json",
  );

  it("detects and reads OpenInference document fixtures by default", async () => {
    const detection = await detectTraceFormat({ type: "file", path: basicFixture });
    const result = await readTrace({ type: "file", path: basicFixture });

    expect(detection).toMatchObject({
      status: "detected",
      format: "openinference-json",
      candidates: [
        expect.objectContaining({
          readerName: "OpenInference JSON",
          description: "OpenInference document",
        }),
      ],
    });
    expect(result).toMatchObject({
      format: "openinference-json",
      sourceFiles: [basicFixture],
      unsupportedFields: expect.arrayContaining([
        "spans[0].attributes.input.value",
        "spans[0].events",
        "spans[1].attributes.output.value",
      ]),
    });
    expect(result.events).toHaveLength(2);
    expect(result.events[0]).toMatchObject({
      eventId: "run-event",
      runId: "run-oi-basic",
      kind: "RUN",
      status: "ok",
      durationMs: 5000,
      confidence: "explicit",
      source: { type: "otel", name: "openinference", version: "1.6-fixture" },
      trace: { traceId: "trace-oi-basic", spanId: "span-root" },
    });
    expect(result.events[1]).toMatchObject({
      eventId: "span-llm",
      runId: "trace-oi-basic",
      parentId: "run-event",
      kind: "LLM",
      tokenUsage: { input: 12, output: 7, total: 19 },
      attributes: {
        "custom.flag": true,
        "output.value.summary": { type: "string", length: 18 },
      },
      trace: {
        traceId: "trace-oi-basic",
        spanId: "span-llm",
        parentSpanId: "span-root",
      },
    });
    expect(result.runs).toHaveLength(2);
    expect(result.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "openinference_sensitive_attribute_summarized",
        "openinference_unsupported_field_summarized",
      ]),
    );
    expect(JSON.stringify(result.events)).not.toContain("secret prompt text");
    expect(JSON.stringify(result.events)).not.toContain("secret answer text");
  });

  it("supports raw OpenInference span arrays", async () => {
    const content = JSON.stringify([
      {
        trace_id: "trace-array",
        span_id: "span-tool",
        parent_span_id: "span-parent",
        name: "search",
        start_time: "2024-11-14T12:00:00.000Z",
        end_time: "2024-11-14T12:00:01.250Z",
        attributes: {
          "openinference.span.kind": "TOOL",
          "tool.name": "search",
        },
        status: { code: "ERROR", message: "tool failed" },
      },
    ]);

    const result = await readTrace({ type: "string", content });

    expect(result.format).toBe("openinference-json");
    expect(result.events).toEqual([
      expect.objectContaining({
        eventId: "span-tool",
        runId: "trace-array",
        parentId: "span-parent",
        kind: "TOOL",
        status: "error",
        durationMs: 1250,
        error: { message: "tool failed" },
      }),
    ]);
  });

  it("rejects malformed OpenInference documents with structured warnings", async () => {
    const detection = await detectTraceFormat({
      type: "file",
      path: malformedFixture,
    });

    expect(detection).toMatchObject({
      status: "detected",
      format: "openinference-json",
      warnings: [
        expect.objectContaining({
          code: "openinference_no_valid_spans",
          sourceFile: malformedFixture,
        }),
      ],
    });
    await expect(
      readTrace({ type: "file", path: malformedFixture }),
    ).rejects.toMatchObject({
      code: "unsupported_format",
      warnings: [
        expect.objectContaining({
          code: "openinference_no_valid_spans",
        }),
      ],
    });
  });

  it("supports explicit OpenInference reader selection", async () => {
    const content = await readFile(basicFixture, "utf-8");

    const result = await readTrace(
      { type: "string", content },
      { format: openInferenceJsonReader.format },
    );

    expect(result.format).toBe("openinference-json");
    expect(result.events.map((event) => event.trace?.spanId)).toEqual([
      "span-root",
      "span-llm",
    ]);
  });

  it("reports ambiguity when another reader closely matches an OpenInference fixture", async () => {
    const content = await readFile(basicFixture, "utf-8");
    const nearReader = toyReader({
      format: "near-openinference-json",
      detect() {
        return { format: "near-openinference-json", confidence: 0.88 };
      },
    });

    const detection = await detectTraceFormat(
      { type: "string", content },
      { readers: [openInferenceJsonReader, nearReader] },
    );

    expect(detection.status).toBe("ambiguous");
    expect(detection.candidates.map((candidate) => candidate.format)).toEqual([
      "openinference-json",
      "near-openinference-json",
    ]);
  });
});

describe("OTLP JSON reader", () => {
  const basicFixture = path.join(
    repoRoot,
    "packages/core/test/fixtures/otlp-basic.json",
  );
  const malformedFixture = path.join(
    repoRoot,
    "packages/core/test/fixtures/otlp-malformed.json",
  );

  it("detects and reads OTLP JSON trace payload fixtures by default", async () => {
    const detection = await detectTraceFormat({ type: "file", path: basicFixture });
    const result = await readTrace({ type: "file", path: basicFixture });

    expect(detection).toMatchObject({
      status: "detected",
      format: "otlp-json",
      candidates: [
        expect.objectContaining({
          readerName: "OTLP JSON",
          description: "OTLP JSON trace payload",
        }),
      ],
    });
    expect(result).toMatchObject({
      format: "otlp-json",
      sourceFiles: [basicFixture],
      unsupportedFields: expect.arrayContaining([
        "resourceSpans[0].scopeSpans[0].spans[1].attributes.gen_ai.prompt",
        "resourceSpans[0].scopeSpans[0].spans[1].droppedEventsCount",
        "resourceSpans[0].scopeSpans[0].spans[1].events[0].attributes.gen_ai.completion",
      ]),
    });
    expect(result.events).toHaveLength(2);
    expect(result.events[0]).toMatchObject({
      eventId: "run-event",
      runId: "run-otlp-basic",
      kind: "RUN",
      status: "ok",
      durationMs: 5000,
      confidence: "explicit",
      source: {
        type: "otel",
        name: "agent-inspect-test-scope",
        version: "1.6-fixture",
      },
      trace: {
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
        spanId: "00f067aa0ba902b7",
      },
    });
    expect(result.events[1]).toMatchObject({
      eventId: "00f067aa0ba902b8",
      runId: "4bf92f3577b34da6a3ce929d0e0e4736",
      parentId: "run-event",
      kind: "LLM",
      tokenUsage: { input: 12, output: 7, total: 19 },
      attributes: {
        "gen_ai.prompt.summary": { type: "string", length: 18 },
        "resource.service.name": "agent-inspect-fixture",
        "scope.name": "agent-inspect-test-scope",
        "otlp.events": [
          expect.objectContaining({
            name: "chunk",
            attributes: expect.objectContaining({
              "gen_ai.completion.summary": { type: "string", length: 18 },
              "chunk.index": 1,
            }),
          }),
        ],
      },
      trace: {
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
        spanId: "00f067aa0ba902b8",
        parentSpanId: "00f067aa0ba902b7",
      },
    });
    expect(result.runs).toHaveLength(2);
    expect(result.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "otlp_sensitive_attribute_summarized",
        "otlp_span_field_not_mapped",
      ]),
    );
    expect(JSON.stringify(result.events)).not.toContain("secret prompt text");
    expect(JSON.stringify(result.events)).not.toContain("secret answer text");
  });

  it("supports raw OTLP error spans", async () => {
    const content = JSON.stringify({
      resourceSpans: [
        {
          scopeSpans: [
            {
              spans: [
                {
                  traceId: "trace-error",
                  spanId: "span-error",
                  parentSpanId: "span-parent",
                  name: "tool",
                  startTimeUnixNano: "1700000000000000000",
                  endTimeUnixNano: "1700000001250000000",
                  attributes: [
                    {
                      key: "gen_ai.operation.name",
                      value: { stringValue: "execute_tool" },
                    },
                  ],
                  status: {
                    code: "STATUS_CODE_ERROR",
                    message: "tool failed",
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const result = await readTrace({ type: "string", content });

    expect(result.format).toBe("otlp-json");
    expect(result.events).toEqual([
      expect.objectContaining({
        eventId: "span-error",
        runId: "trace-error",
        parentId: "span-parent",
        kind: "TOOL",
        status: "error",
        durationMs: 1250,
        error: { message: "tool failed" },
      }),
    ]);
  });

  it("rejects malformed OTLP documents with structured warnings", async () => {
    const detection = await detectTraceFormat({
      type: "file",
      path: malformedFixture,
    });

    expect(detection).toMatchObject({
      status: "detected",
      format: "otlp-json",
      warnings: expect.arrayContaining([
        expect.objectContaining({
          code: "otlp_invalid_span",
          sourceFile: malformedFixture,
        }),
        expect.objectContaining({
          code: "otlp_no_valid_spans",
          sourceFile: malformedFixture,
        }),
      ]),
    });
    await expect(
      readTrace({ type: "file", path: malformedFixture }),
    ).rejects.toMatchObject({
      code: "unsupported_format",
      warnings: expect.arrayContaining([
        expect.objectContaining({ code: "otlp_no_valid_spans" }),
      ]),
    });
  });

  it("supports explicit OTLP reader selection", async () => {
    const content = await readFile(basicFixture, "utf-8");

    const result = await readTrace(
      { type: "string", content },
      { format: otlpJsonReader.format },
    );

    expect(result.format).toBe("otlp-json");
    expect(result.events.map((event) => event.trace?.spanId)).toEqual([
      "00f067aa0ba902b7",
      "00f067aa0ba902b8",
    ]);
  });

  it("reports ambiguity when another reader closely matches an OTLP fixture", async () => {
    const content = await readFile(basicFixture, "utf-8");
    const nearReader = toyReader({
      format: "near-otlp-json",
      detect() {
        return { format: "near-otlp-json", confidence: 0.9 };
      },
    });

    const detection = await detectTraceFormat(
      { type: "string", content },
      { readers: [otlpJsonReader, nearReader] },
    );

    expect(detection.status).toBe("ambiguous");
    expect(detection.candidates.map((candidate) => candidate.format)).toEqual([
      "otlp-json",
      "near-otlp-json",
    ]);
  });
});
