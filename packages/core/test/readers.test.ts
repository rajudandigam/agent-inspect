import { describe, expect, it } from "vitest";

import {
  TraceReadError,
  detectTraceFormat,
  openTrace,
  readTrace,
  type TraceReader,
} from "../src/readers/index.js";

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
