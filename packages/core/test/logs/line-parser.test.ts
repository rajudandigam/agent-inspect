import { describe, expect, it } from "vitest";

import { parseLogLine } from "../../src/logs/line-parser.js";

describe("parseLogLine", () => {
  it("blank line yields no records and no warnings", () => {
    const res = parseLogLine("   \n");
    expect(res.records).toHaveLength(0);
    expect(res.warnings).toHaveLength(0);
  });

  it("JSON line parses as json-log", () => {
    const res = parseLogLine('{"event":"x","decisionId":"d1"}', {
      format: "json",
      file: "a.log",
      line: 9,
    });
    expect(res.records).toHaveLength(1);
    expect(res.warnings).toHaveLength(0);
    expect(res.records[0]?.sourceType).toBe("json-log");
    expect(res.records[0]?.file).toBe("a.log");
    expect(res.records[0]?.line).toBe(9);
  });

  it("malformed JSON produces MALFORMED_JSON warning", () => {
    const res = parseLogLine("{ not json", { format: "json", line: 3 });
    expect(res.records).toHaveLength(0);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0]?.code).toBe("MALFORMED_JSON");
    expect(res.warnings[0]?.line).toBe(3);
  });

  it("log4js line extracts embedded JSON and preserves source type", () => {
    const res = parseLogLine(
      '2026-01-01 [INFO] - hi {"event":"x","decisionId":"d1"}',
      { format: "log4js", file: "b.log", line: 44 },
    );
    expect(res.records).toHaveLength(1);
    expect(res.records[0]?.sourceType).toBe("log4js");
    expect(res.records[0]?.file).toBe("b.log");
    expect(res.records[0]?.line).toBe(44);
  });

  it("log4js plain text yields UNSUPPORTED_LOG4JS_PAYLOAD", () => {
    const res = parseLogLine("just text", { format: "log4js", line: 2 });
    expect(res.records).toHaveLength(0);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0]?.code).toBe("UNSUPPORTED_LOG4JS_PAYLOAD");
    expect(res.warnings[0]?.line).toBe(2);
  });

  it("JS object-literal style payload is unsupported (no eval)", () => {
    const res = parseLogLine('INFO Agent { event: "x", decisionId: "d1" }', {
      format: "log4js",
    });
    expect(res.records).toHaveLength(0);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it("auto detects JSON when line starts with {", () => {
    const res = parseLogLine('{"event":"x","decisionId":"d1"}', { format: "auto" });
    expect(res.records).toHaveLength(1);
    expect(res.records[0]?.sourceType).toBe("json-log");
  });

  it("auto detects log4js otherwise", () => {
    const res = parseLogLine('INFO {"event":"x","decisionId":"d1"}', { format: "auto" });
    expect(res.records).toHaveLength(1);
    expect(res.records[0]?.sourceType).toBe("log4js");
  });
});

