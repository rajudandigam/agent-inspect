import type { RedactionProfile } from "agent-inspect";
import type { TraceWriter } from "agent-inspect/writers";

/**
 * Experimental capture mode for the OpenAI Agents JS adapter scaffold.
 *
 * @experimental This package is part of the v1.7 adapter train.
 */
export type AgentInspectOpenAiAgentsCaptureMode = "metadata-only" | "preview";

/**
 * Options for the experimental OpenAI Agents JS tracing processor scaffold.
 *
 * @experimental Runtime span mapping is intentionally not implemented in this
 * chunk. Install future processors with `setTraceProcessors([...])` replacement
 * only; do not use `addTraceProcessor()` as the default path.
 */
export interface AgentInspectOpenAiAgentsOptions {
  /**
   * Explicit local writer for future runtime integration.
   */
  writer?: TraceWriter;

  /**
   * Convenience local trace directory for future writer-owned persistence.
   */
  traceDir?: string;

  /**
   * Optional workflow name used by future trace mapping.
   */
  workflowName?: string;

  /**
   * Capture policy. Defaults to metadata-only when runtime mapping lands.
   */
  capture?: AgentInspectOpenAiAgentsCaptureMode;

  /**
   * Redaction profile applied before local persistence in future mapping.
   */
  redactionProfile?: RedactionProfile;

  /**
   * Bounds any future preview capture.
   */
  maxPreviewChars?: number;
}

export interface AgentInspectOpenAiAgentsDiagnostics {
  writeFailures: number;
  lastError?: string;
  runtimeMappingImplemented: false;
}

export interface AgentInspectOpenAiAgentsProcessor {
  /**
   * Documents the only safe default install mode for this adapter.
   */
  readonly installMode: "setTraceProcessors";

  /**
   * This scaffold never installs itself globally and performs no network I/O.
   */
  readonly localOnly: true;

  /**
   * Return scaffold diagnostics. Runtime span mapping lands in a later chunk.
   */
  getDiagnostics(): AgentInspectOpenAiAgentsDiagnostics;
}

const DEFAULT_DIAGNOSTICS: AgentInspectOpenAiAgentsDiagnostics = {
  writeFailures: 0,
  runtimeMappingImplemented: false,
};

/**
 * Create an AgentInspect OpenAI Agents JS tracing processor scaffold.
 *
 * @experimental This chunk exposes a local-only placeholder so package
 * boundaries, exports, docs, and smoke tests can land before runtime mapping.
 * Future docs must install the real processor with:
 *
 * ```ts
 * setTraceProcessors([agentInspectProcessor(options)]);
 * ```
 *
 * The scaffold does not call `setTraceProcessors()`, `addTraceProcessor()`,
 * OpenAI exporters, or network APIs on import or construction.
 */
export function agentInspectProcessor(
  _options: AgentInspectOpenAiAgentsOptions = {},
): AgentInspectOpenAiAgentsProcessor {
  return {
    installMode: "setTraceProcessors",
    localOnly: true,
    getDiagnostics: () => ({ ...DEFAULT_DIAGNOSTICS }),
  };
}
