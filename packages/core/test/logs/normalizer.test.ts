import { describe, expect, it } from "vitest";

import { EventNormalizer } from "../../src/logs/normalizer.js";
import type { LogIngestConfig } from "../../src/types/log-config.js";
import type { RawLogRecord } from "../../src/logs/raw-record.js";

const baseConfig: LogIngestConfig = {
  runIdKeys: ["decisionId", "runId"],
  eventKey: "event",
  timestampKey: "timestamp",
  mappings: {
    "proactive.job.started": { kind: "RUN", name: "job:started", startsRun: true },
    "proactive.tool.*": { kind: "TOOL" },
    "*.failed": { kind: "ERROR", status: "error" },
  },
};

function rec(raw: Record<string, unknown>): RawLogRecord {
  return { raw, line: 1, sourceType: "json-log", file: "x.log" };
}

describe("EventNormalizer", () => {
  it("extracts runId from first matching key", () => {
    const n = new EventNormalizer({ config: baseConfig });
    const e = n.normalize(
      rec({ decisionId: "d1", runId: "r2", event: "proactive.job.started", timestamp: 1 }),
    );
    expect("eventId" in e).toBe(true);
    expect((e as any).runId).toBe("d1");
  });

  it("missing runId becomes warning", () => {
    const n = new EventNormalizer({ config: baseConfig });
    const w = n.normalize(rec({ event: "x", timestamp: 1 }));
    expect((w as any).code).toBe("MISSING_RUN_ID");
  });

  it("missing event becomes warning", () => {
    const n = new EventNormalizer({ config: baseConfig });
    const w = n.normalize(rec({ decisionId: "d", timestamp: 1 }));
    expect((w as any).code).toBe("MISSING_EVENT");
  });

  it("numeric and ISO timestamps are supported", () => {
    const n = new EventNormalizer({ config: baseConfig });
    const e1 = n.normalize(rec({ decisionId: "d", event: "x", timestamp: 123 }));
    const e2 = n.normalize(
      rec({ decisionId: "d", event: "x", timestamp: new Date(123).toISOString() }),
    );
    expect((e1 as any).timestamp).toBe(123);
    expect((e2 as any).timestamp).toBe(123);
  });

  it("missing timestamp yields warning but still emits event in normalizeAll", () => {
    const n = new EventNormalizer({ config: baseConfig });
    const res = n.normalizeAll([rec({ decisionId: "d", event: "x" })]);
    expect(res.records).toHaveLength(1);
    expect(res.warnings.some((w) => w.code === "MISSING_TIMESTAMP")).toBe(true);
  });

  it("parentId yields explicit confidence", () => {
    const n = new EventNormalizer({ config: { ...baseConfig, parentIdKey: "parentId" } });
    const e = n.normalize(rec({ decisionId: "d", event: "x", timestamp: 1, parentId: "p" }));
    expect((e as any).confidence).toBe("explicit");
  });

  it("mapping wildcard sets kind and name is derived", () => {
    const n = new EventNormalizer({ config: baseConfig });
    const e = n.normalize(
      rec({ decisionId: "d", event: "proactive.tool.search", timestamp: 1, jobId: "j" }),
    );
    expect((e as any).kind).toBe("TOOL");
    expect((e as any).name).toContain("tool:");
  });

  it("status from mapping and failed/error name", () => {
    const n = new EventNormalizer({ config: baseConfig });
    const e = n.normalize(rec({ decisionId: "d", event: "x.failed", timestamp: 1 }));
    expect((e as any).status).toBe("error");
  });

  it("error/failed match complete dot tokens, including mid-name", () => {
    const n = new EventNormalizer({ config: baseConfig });
    const mid = n.normalize(
      rec({ decisionId: "d", event: "app.error.timeout", timestamp: 1 }),
    );
    expect((mid as any).kind).toBe("ERROR");
    expect((mid as any).status).toBe("error");
  });

  it("does not flag error/failed substrings inside larger tokens", () => {
    const n = new EventNormalizer({ config: baseConfig });

    const budget = n.normalize(
      rec({ decisionId: "d", event: "payment.error_budget.checked", timestamp: 1 }),
    );
    expect((budget as any).kind).toBe("LOG");
    expect((budget as any).status).toBeUndefined();

    const retry = n.normalize(
      rec({ decisionId: "d", event: "proactive.tool.error_retry", timestamp: 1 }),
    );
    expect((retry as any).kind).toBe("TOOL");
    expect((retry as any).status).toBeUndefined();

    const reset = n.normalize(
      rec({ decisionId: "d", event: "worker.failed_attempts_reset", timestamp: 1 }),
    );
    expect((reset as any).kind).toBe("LOG");
    expect((reset as any).status).toBeUndefined();
  });

  it("attributes exclude used keys and preserve metadata", () => {
    const n = new EventNormalizer({ config: baseConfig });
    const e = n.normalize(
      rec({ decisionId: "d", event: "x", timestamp: 1, model: "m", tokens: { input: 1 } }),
    );
    expect((e as any).attributes).toEqual({ model: "m", tokens: { input: 1 } });
  });
});

