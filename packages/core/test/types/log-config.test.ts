import { describe, expect, it } from "vitest";

import type {
  LogIngestConfig,
  RedactionRule,
  RedactionStrategy,
} from "../../src/types/log-config.js";

describe("v0.3 LogIngestConfig types", () => {
  it("accepts minimum required fields", () => {
    const c: LogIngestConfig = {
      runIdKeys: ["runId"],
      eventKey: "event",
    };
    expect(c.runIdKeys[0]).toBe("runId");
    expect(c.eventKey).toBe("event");
  });

  it("RedactionRule supports string and object forms", () => {
    const a: RedactionRule = "token";
    const b: RedactionRule = { key: "userUuid", strategy: "prefix", keep: 8 };
    const s: RedactionStrategy = "hash";
    expect(a).toBe("token");
    expect((b as any).strategy).toBe("prefix");
    expect(s).toBe("hash");
  });
});

