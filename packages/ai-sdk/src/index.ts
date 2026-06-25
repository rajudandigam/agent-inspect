import { bindTelemetryIntegration } from "ai";
import type { TelemetryIntegration } from "ai";
import type { RedactionProfile } from "agent-inspect";
import type { TraceWriter } from "agent-inspect/writers";

/**
 * Experimental capture mode for the AI SDK adapter.
 *
 * @experimental This package is part of the v1.7 adapter train and the runtime
 * lifecycle mapping is intentionally deferred to a later chunk.
 */
export type AgentInspectAiSdkCaptureMode = "metadata-only" | "preview";

/**
 * Options for the experimental AI SDK telemetry integration.
 *
 * @experimental This scaffold defines the package boundary only. It does not
 * yet persist AI SDK lifecycle events. Callers must keep AI SDK telemetry
 * configured with `recordInputs: false` and `recordOutputs: false`.
 */
export interface AgentInspectAiSdkOptions {
  /**
   * Explicit local writer for future runtime integration.
   */
  writer?: TraceWriter;

  /**
   * Convenience local trace directory for future writer-owned persistence.
   */
  traceDir?: string;

  /**
   * Optional run name used by future lifecycle mapping.
   */
  runName?: string;

  /**
   * Capture policy. Defaults to metadata-only when runtime mapping lands.
   */
  capture?: AgentInspectAiSdkCaptureMode;

  /**
   * Redaction profile applied before local persistence in future mapping.
   */
  redactionProfile?: RedactionProfile;

  /**
   * Bounds any future preview capture.
   */
  maxPreviewChars?: number;
}

/**
 * Create an AgentInspect telemetry integration for the Vercel AI SDK.
 *
 * @experimental Scaffold only: this currently returns a no-op
 * `TelemetryIntegration` while the package boundary is validated. Runtime
 * lifecycle mapping will land in the dedicated v1.7 implementation chunk.
 */
export function agentInspect(
  options: AgentInspectAiSdkOptions = {},
): TelemetryIntegration {
  void options;

  return bindTelemetryIntegration({});
}
