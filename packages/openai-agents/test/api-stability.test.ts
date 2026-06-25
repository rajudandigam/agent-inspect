import { describe, expect, it } from "vitest";

import {
  agentInspectProcessor,
  type AgentInspectOpenAiAgentsCaptureMode,
  type AgentInspectOpenAiAgentsOptions,
} from "@agent-inspect/openai-agents";

describe("@agent-inspect/openai-agents scaffold", () => {
  it("exports the experimental local-only processor factory and option types", () => {
    const capture: AgentInspectOpenAiAgentsCaptureMode = "metadata-only";
    const options: AgentInspectOpenAiAgentsOptions = {
      capture,
      workflowName: "fixture-openai-agents-run",
      traceDir: ".agent-inspect",
    };

    const processor = agentInspectProcessor(options);

    expect(processor.installMode).toBe("setTraceProcessors");
    expect(processor.localOnly).toBe(true);
    expect(processor.getDiagnostics()).toEqual({
      writeFailures: 0,
      runtimeMappingImplemented: false,
    });
  });

  it("does not auto-install or expose additive processor defaults", () => {
    const processor = agentInspectProcessor();

    expect(Object.keys(processor)).toEqual([
      "installMode",
      "localOnly",
      "getDiagnostics",
    ]);
    expect(processor.installMode).not.toBe("addTraceProcessor");
  });
});
