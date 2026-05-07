import { describe, expect, it } from "vitest";

import type { ParseResult, ParserWarning } from "../../src/logs/warnings.js";

describe("logs warnings model", () => {
  it("ParseResult carries records and warnings", () => {
    const w: ParserWarning = { code: "UNKNOWN", message: "x", line: 1 };
    const r: ParseResult<number> = { records: [1, 2], warnings: [w] };
    expect(r.records).toEqual([1, 2]);
    expect(r.warnings[0]?.code).toBe("UNKNOWN");
  });
});

