import { describe, expect, it } from "vitest";

import { formatDuration, parseDuration } from "../../src/utils/duration.js";

describe("parseDuration", () => {
  it("parses milliseconds", () => {
    expect(parseDuration("500ms")).toBe(500);
    expect(parseDuration("1ms")).toBe(1);
  });

  it("parses seconds", () => {
    expect(parseDuration("30s")).toBe(30_000);
  });

  it("parses minutes", () => {
    expect(parseDuration("5m")).toBe(5 * 60_000);
  });

  it("parses hours", () => {
    expect(parseDuration("2h")).toBe(2 * 3_600_000);
  });

  it("parses days", () => {
    expect(parseDuration("7d")).toBe(7 * 24 * 3_600_000);
  });

  it("throws on invalid string", () => {
    expect(() => parseDuration("invalid")).toThrow(/Invalid duration format/i);
  });

  it("throws on unknown unit", () => {
    expect(() => parseDuration("1x")).toThrow(/Invalid duration format/i);
  });

  it("throws on zero", () => {
    expect(() => parseDuration("0s")).toThrow(/positive integer/i);
  });

  it("throws on negative", () => {
    expect(() => parseDuration("-1s")).toThrow(/Invalid duration format/i);
  });
});

describe("formatDuration", () => {
  it("formats milliseconds", () => {
    expect(formatDuration(500)).toBe("500ms");
  });

  it("formats seconds (< 1m)", () => {
    expect(formatDuration(2500)).toBe("2.50s");
  });

  it("formats minutes (< 1h)", () => {
    expect(formatDuration(125_000)).toBe("2.1m");
  });

  it("formats hours", () => {
    expect(formatDuration(7_200_000)).toBe("2.0h");
  });

  it("throws on negative values", () => {
    expect(() => formatDuration(-1)).toThrow(/non-negative/i);
  });
});

