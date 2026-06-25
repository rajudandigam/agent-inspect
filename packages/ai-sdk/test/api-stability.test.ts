import { describe, expect, it } from "vitest";

import { agentInspect } from "@agent-inspect/ai-sdk";
import type {
  AgentInspectAiSdkCaptureMode,
  AgentInspectAiSdkOptions,
} from "@agent-inspect/ai-sdk";

describe("@agent-inspect/ai-sdk scaffold", () => {
  it("exports the experimental integration factory and option types", () => {
    const capture: AgentInspectAiSdkCaptureMode = "metadata-only";
    const options: AgentInspectAiSdkOptions = {
      capture,
      runName: "fixture-ai-sdk-run",
      traceDir: ".agent-inspect",
    };

    const integration = agentInspect(options);

    expect(integration).toEqual({});
  });
});
