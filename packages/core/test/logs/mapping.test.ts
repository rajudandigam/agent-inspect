import { describe, expect, it } from "vitest";

import { matchMapping, wildcardMatch } from "../../src/logs/mapping.js";

describe("mapping", () => {
  it("wildcardMatch supports prefix/suffix/middle", () => {
    expect(wildcardMatch("a.*", "a.b")).toBe(true);
    expect(wildcardMatch("*.failed", "a.b.failed")).toBe(true);
    expect(wildcardMatch("a.*.failed", "a.b.failed")).toBe(true);
    expect(wildcardMatch("a.*.failed", "a.b.c.failed")).toBe(true);
    expect(wildcardMatch("a.*.failed", "x.b.failed")).toBe(false);
  });

  it("exact beats wildcard and most specific wildcard wins", () => {
    const m = {
      "a.b": { name: "exact" },
      "a.*": { name: "broad" },
      "a.*.c": { name: "mid" },
      "a.b.*": { name: "more" },
    };
    expect(matchMapping("a.b", m as any)?.name).toBe("exact");
    expect(matchMapping("a.x.c", m as any)?.name).toBe("mid");
    expect(matchMapping("a.b.x", m as any)?.name).toBe("more");
  });

  it("no mappings returns undefined", () => {
    expect(matchMapping("x", undefined)).toBeUndefined();
  });
});

