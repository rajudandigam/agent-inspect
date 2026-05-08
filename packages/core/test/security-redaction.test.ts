import { describe, expect, it } from "vitest";

import { compactAttributes } from "../src/exporters/helpers.js";
import { Redactor } from "../src/logs/redactor.js";

describe("security/redaction expectations", () => {
  it("Redactor default keys redact common secrets (including nested)", () => {
    const r = new Redactor();
    const out = r.redactRecord({
      token: "t",
      nested: { password: "p", apiKey: "k" },
      ok: 1,
    });
    expect(out.token).toBe("[REDACTED]");
    expect((out.nested as any).password).toBe("[REDACTED]");
    expect((out.nested as any).apiKey).toBe("[REDACTED]");
    expect(out.ok).toBe(1);
  });

  it("export attribute compaction redacts by key substring when redacted=true", () => {
    const attrs = compactAttributes(
      { Authorization: "bearer x", apiKey: "k", emailAddress: "x@example.test", safe: "ok" },
      { redacted: true, maxLength: 500 },
    );
    expect(attrs.Authorization).toBe("[REDACTED]");
    expect(attrs.apiKey).toBe("[REDACTED]");
    expect(attrs.emailAddress).toBe("[REDACTED]");
    expect(attrs.safe).toBe("ok");
  });
});

