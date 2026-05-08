import { describe, expect, it } from "vitest";

import { Redactor } from "../../src/logs/redactor.js";

describe("redaction (pre-v1.0 conformance)", () => {
  it("redacts default sensitive keys", () => {
    const r = new Redactor({});
    expect(r.redactValue("email", "person@example.test")).toBe("[REDACTED]");
    expect(r.redactValue("token", "x")).toBe("[REDACTED]");
  });

  it("prefix strategy is deterministic", () => {
    const r = new Redactor({
      rules: [{ key: "userUuid", strategy: "prefix", keep: 8 }],
    });
    const out = r.redactValue("userUuid", "f0769fd4-aaaa-bbbb-cccc-ddddeeeeffff");
    expect(out).toContain("f0769fd4");
    expect(out).toContain("…");
  });

  it("hash strategy is stable for identical inputs", () => {
    const r = new Redactor({
      rules: [{ key: "secretRef", strategy: "hash" }],
    });
    const a = r.redactValue("secretRef", "same");
    const b = r.redactValue("secretRef", "same");
    expect(a).toBe(b);
  });

  it("redacts nested objects", () => {
    const r = new Redactor({});
    const rec = r.redactRecord({
      outer: { email: "person@example.test", ok: 1 },
    });
    expect(rec).toEqual({
      outer: { email: "[REDACTED]", ok: 1 },
    });
  });
});
