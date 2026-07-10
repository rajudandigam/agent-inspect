import { describe, expect, it } from "vitest";

import { createKindFilterTransform, runAdapterConformance, runTransformPipeline } from "../src/index.js";
import { fakeFrameworkEvents } from "../../../examples/adapter-sdk/custom-transform/src/events.js";
import { createFakeFrameworkNormalizeTransform } from "../../../examples/adapter-sdk/custom-transform/src/transform.js";

describe("custom transform example", () => {
  it("normalizes fakefw tool and llm events into standard conventions", () => {
    const result = runTransformPipeline(fakeFrameworkEvents(), [
      createFakeFrameworkNormalizeTransform(),
    ]);

    const tool = result.events.find((event) => event.eventId === "call_1");
    expect(tool?.kind).toBe("TOOL");
    expect(tool?.name).toBe("tool:search-flights");
    expect(tool?.durationMs).toBe(250);
    expect(tool?.attributes?.toolName).toBe("search-flights");
    expect(Object.keys(tool?.attributes ?? {}).some((key) => key.startsWith("fakefw."))).toBe(
      false,
    );

    const llm = result.events.find((event) => event.eventId === "call_2");
    expect(llm?.kind).toBe("LLM");
    expect(llm?.name).toBe("llm:draft-reply");
    expect(llm?.durationMs).toBe(1200);
    expect(llm?.attributes?.model).toBe("fixture-model");
  });

  it("leaves unknown channels unchanged and warns instead of guessing", () => {
    const result = runTransformPipeline(fakeFrameworkEvents(), [
      createFakeFrameworkNormalizeTransform(),
    ]);

    const telemetry = result.events.find((event) => event.eventId === "call_3");
    expect(telemetry?.kind).toBe("LOGIC");
    expect(telemetry?.attributes?.["fakefw.channel"]).toBe("telemetry");
    expect(
      result.warnings.some((warning) => warning.code === "transform.fakefw.unknown-channel"),
    ).toBe(true);
  });

  it("does not mutate the input events", () => {
    const input = fakeFrameworkEvents();
    const before = JSON.stringify(input);
    runTransformPipeline(input, [createFakeFrameworkNormalizeTransform()]);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("composes with kind filtering and passes adapter conformance", async () => {
    const result = runTransformPipeline(fakeFrameworkEvents(), [
      createFakeFrameworkNormalizeTransform(),
      createKindFilterTransform(["TOOL", "LLM"]),
    ]);
    expect(
      result.events.every(
        (event) => event.kind === "TOOL" || event.kind === "LLM" || event.kind === "RUN",
      ),
    ).toBe(true);

    const conformance = await runAdapterConformance({
      adapterId: "fakefw-normalize-example",
      events: result.events,
      forbiddenRawStrings: ["fakefw-secret"],
    });
    expect(conformance.ok).toBe(true);
  });
});
