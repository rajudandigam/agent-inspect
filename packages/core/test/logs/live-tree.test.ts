import { describe, expect, it } from "vitest";

import { DEFAULT_LOG_INGEST_CONFIG } from "../../src/logs/config.js";
import { LiveLogAccumulator } from "../../src/logs/live-tree.js";

describe("LiveLogAccumulator", () => {
  it("pushLine accepts JSON line and updates events/trees", () => {
    const acc = new LiveLogAccumulator({
      config: DEFAULT_LOG_INGEST_CONFIG,
      format: "json",
      file: "stdin",
    });

    const res = acc.pushLine('{"event":"proactive.job.started","decisionId":"d1","timestamp":1}');
    expect(res.events.length).toBe(1);
    expect(res.trees.length).toBe(1);
    expect(res.trees[0]?.runId).toBe("d1");
    expect(res.events[0]?.source.type).toBe("json-log");
  });

  it("pushLine accepts log4js line and updates events/trees", () => {
    const acc = new LiveLogAccumulator({
      config: DEFAULT_LOG_INGEST_CONFIG,
      format: "log4js",
      file: "file.log",
    });

    const res = acc.pushLine('INFO hi {"event":"proactive.job.started","decisionId":"d1","timestamp":1}', 10);
    expect(res.events.length).toBe(1);
    expect(res.events[0]?.source.type).toBe("log4js");
    expect(res.events[0]?.source.line).toBe(10);
  });

  it("malformed lines produce warnings but do not throw", () => {
    const acc = new LiveLogAccumulator({
      config: DEFAULT_LOG_INGEST_CONFIG,
      format: "json",
    });

    const res = acc.pushLine("{ not json", 2);
    expect(res.events.length).toBe(0);
    expect(res.warnings.length).toBe(1);
    expect(res.warnings[0]?.code).toBe("MALFORMED_JSON");
    expect(res.warnings[0]?.line).toBe(2);
  });

  it("redaction is applied before events are stored", () => {
    const acc = new LiveLogAccumulator({
      config: {
        ...DEFAULT_LOG_INGEST_CONFIG,
        runIdKeys: ["decisionId"],
        eventKey: "event",
        redact: [{ key: "email", strategy: "hash" }],
      },
      format: "json",
    });

    const res = acc.pushLine(
      '{"event":"x","decisionId":"d1","timestamp":1,"email":"person@example.com"}',
    );
    expect(res.events.length).toBe(1);
    expect(res.events[0]?.attributes?.email).toMatch(/^\[HASH:/);
  });

  it("reset clears events/trees/warnings", () => {
    const acc = new LiveLogAccumulator({ config: DEFAULT_LOG_INGEST_CONFIG, format: "json" });
    acc.pushLine('{"event":"x","decisionId":"d1","timestamp":1}');
    expect(acc.getEvents().length).toBe(1);
    acc.reset();
    expect(acc.getEvents().length).toBe(0);
    expect(acc.getTrees().length).toBe(0);
    expect(acc.getWarnings().length).toBe(0);
  });
});

