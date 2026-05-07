import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { JsonLogParser } from "../../src/logs/json-parser.js";

describe("JsonLogParser", () => {
  it("parses valid JSONL and skips blank lines", () => {
    const parser = new JsonLogParser();
    const res = parser.parseLines([
      "",
      "  ",
      JSON.stringify({ a: 1, event: "x" }),
      JSON.stringify({ b: 2 }),
    ]);
    expect(res.records.length).toBe(2);
    expect(res.records[0]?.sourceType).toBe("json-log");
    expect(res.warnings.length).toBe(0);
  });

  it("malformed and non-object lines become warnings", () => {
    const parser = new JsonLogParser();
    const res = parser.parseLines(["{ not json", JSON.stringify([1, 2, 3])], "f.log");
    expect(res.records.length).toBe(0);
    expect(res.warnings.length).toBe(2);
    expect(res.warnings[0]?.file).toBe("f.log");
    expect(res.warnings[0]?.line).toBe(1);
  });

  it("parseFile reads real file", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-jsonp-"));
    const file = path.join(dir, "sample.log");
    await writeFile(file, JSON.stringify({ ok: true }) + "\n", "utf-8");
    const parser = new JsonLogParser();
    const res = await parser.parseFile(file);
    expect(res.records).toHaveLength(1);
    await rm(dir, { recursive: true, force: true });
  });

  it("missing file throws clear error", async () => {
    const parser = new JsonLogParser();
    await expect(parser.parseFile("/no/such/file.jsonl")).rejects.toThrow(
      /Failed to read log file/i,
    );
  });
});

