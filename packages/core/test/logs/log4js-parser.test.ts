import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { Log4jsParser } from "../../src/logs/log4js-parser.js";

describe("Log4jsParser", () => {
  it("extracts embedded JSON object payloads", () => {
    const parser = new Log4jsParser();
    const line =
      "2026-01-01 00:00:00 INFO app - message {\"event\":\"x\",\"runId\":\"r1\"}";
    const res = parser.parseLines([line], "a.log");
    expect(res.records).toHaveLength(1);
    expect(res.records[0]?.raw.event).toBe("x");
    expect(res.records[0]?.sourceType).toBe("log4js");
    expect(res.warnings).toHaveLength(0);
  });

  it("plain text line becomes UNSUPPORTED warning", () => {
    const parser = new Log4jsParser();
    const res = parser.parseLines(["hello world"], "a.log");
    expect(res.records).toHaveLength(0);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0]?.code).toBe("UNSUPPORTED_LOG4JS_PAYLOAD");
  });

  it("JS object literal style is not parsed", () => {
    const parser = new Log4jsParser();
    const res = parser.parseLines(["INFO - { event: \"x\" }"], "a.log");
    expect(res.records).toHaveLength(0);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it("malformed embedded JSON becomes warning", () => {
    const parser = new Log4jsParser();
    const res = parser.parseLines(["INFO - {\"event\": \"x\""], "a.log");
    expect(res.records).toHaveLength(0);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it("multiple JSON objects uses the last valid one", () => {
    const parser = new Log4jsParser();
    const line =
      "INFO - first {\"event\":\"a\"} second {\"event\":\"b\",\"runId\":\"r\"}";
    const res = parser.parseLines([line], "a.log");
    expect(res.records).toHaveLength(1);
    expect(res.records[0]?.raw.event).toBe("b");
  });

  it("parseFile reads real file", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-log4-"));
    const file = path.join(dir, "sample.log");
    await writeFile(
      file,
      "INFO - {\"event\":\"x\",\"runId\":\"r\"}\n",
      "utf-8",
    );
    const parser = new Log4jsParser();
    const res = await parser.parseFile(file);
    expect(res.records).toHaveLength(1);
    await rm(dir, { recursive: true, force: true });
  });
});

