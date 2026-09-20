import { describe, expect, it } from "vitest";

import { redactTraceEventsForReport } from "../src/exporters/redact-export.js";
import type { TraceEvent } from "../src/types.js";

function stepWithMetadata(metadata: Record<string, unknown>): TraceEvent {
  return {
    event: "step_started",
    runId: "run-1",
    stepId: "step-1",
    name: "click #checkout",
    timestamp: 1,
    metadata,
  } as TraceEvent;
}

function metadataOf(event: TraceEvent): Record<string, unknown> {
  return (event as { metadata: Record<string, unknown> }).metadata;
}

describe("redactTraceEventsForReport url handling", () => {
  it("strips credentials from urls under share", () => {
    const [event] = redactTraceEventsForReport(
      [
        stepWithMetadata({
          url: "https://app.example.com/orders/5f2b9a1c-0d3e-4d1a-9b7e-2c1f4a6b8d90/checkout?token=abcdef1234567890&step=2",
          pageUrl: "https://admin:hunter2pass@internal.example.com/dash",
          redirect:
            "https://app.example.com/cb#access_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk",
        }),
      ],
      { redactionProfile: "share" },
    );

    expect(metadataOf(event)).toEqual({
      url: "https://app.example.com/orders/[id]/checkout?token=[REDACTED]&step=2",
      pageUrl: "https://internal.example.com/dash",
      redirect: "https://app.example.com/cb#access_token=[REDACTED]",
    });
  });

  it("strips credentials from urls under strict", () => {
    const [event] = redactTraceEventsForReport(
      [
        stepWithMetadata({
          url: "https://app.example.com/a/b?api_key=sk-proj-abcdefghijklmnop1234",
        }),
      ],
      { redactionProfile: "strict" },
    );

    expect(metadataOf(event)).toEqual({
      url: "https://app.example.com/a/b?api_key=[REDACTED]",
    });
  });

  it("keeps the local profile untouched", () => {
    const original =
      "https://app.example.com/orders/5f2b9a1c-0d3e-4d1a-9b7e-2c1f4a6b8d90/checkout?token=abcdef1234567890";
    const [event] = redactTraceEventsForReport([stepWithMetadata({ url: original })], {
      redactionProfile: "local",
    });

    expect(metadataOf(event)).toEqual({ url: original });
  });

  it("keeps urls without credentials readable", () => {
    const [event] = redactTraceEventsForReport(
      [stepWithMetadata({ url: "https://app.example.com/v2/orders/new?tab=1" })],
      { redactionProfile: "share" },
    );

    expect(metadataOf(event)).toEqual({
      url: "https://app.example.com/v2/orders/new?tab=1",
    });
  });
});
