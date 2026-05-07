import { describe, expect, it } from "vitest";

import { Redactor } from "../../src/logs/redactor.js";

describe("Redactor", () => {
  it("full redaction by default keys", () => {
    const r = new Redactor();
    const out = r.redactRecord({ token: "abc", ok: 1 });
    expect(out.token).toBe("[REDACTED]");
    expect(out.ok).toBe(1);
  });

  it("supports string rule as full redaction", () => {
    const r = new Redactor({ rules: ["userUuid"] });
    const out = r.redactRecord({ userUuid: "u123", other: "x" });
    expect(out.userUuid).toBe("[REDACTED]");
  });

  it("prefix redaction keeps first N chars", () => {
    const r = new Redactor({ rules: [{ key: "userUuid", strategy: "prefix", keep: 4 }] });
    const out = r.redactRecord({ userUuid: "abcdef" });
    expect(out.userUuid).toBe("abcd…");
  });

  it("hash redaction is deterministic", () => {
    const r = new Redactor({ rules: [{ key: "email", strategy: "hash" }] });
    const a = r.redactRecord({ email: "a@example.com" });
    const b = r.redactRecord({ email: "a@example.com" });
    expect(a.email).toBe(b.email);
    expect(String(a.email)).toMatch(/^\[HASH:[0-9a-f]{8}\]$/);
  });

  it("redacts nested objects and arrays without mutating input", () => {
    const r = new Redactor({ rules: ["password"] });
    const input = { nested: { password: "p" }, arr: [{ password: "x" }] };
    const out = r.redactRecord(input);
    expect((out.nested as any).password).toBe("[REDACTED]");
    expect(((out.arr as any[])[0] as any).password).toBe("[REDACTED]");
    expect((input.nested as any).password).toBe("p");
  });

  it("matches keys case-insensitively", () => {
    const r = new Redactor();
    const out = r.redactRecord({ Authorization: "bearer x" } as any);
    expect(out.Authorization).toBe("[REDACTED]");
  });
});

