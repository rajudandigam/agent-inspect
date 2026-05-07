import type { RedactionRule } from "agent-inspect";

export type CaptureMode = "none" | "metadata-only" | "preview";

export interface AgentInspectCallbackOptions {
  runName?: string;
  traceDir?: string;
  silent?: boolean;
  capture?: CaptureMode;
  redact?: RedactionRule[];
  maxPreviewChars?: number;
}

export interface LangChainRunMetadata {
  runId: string;
  parentRunId?: string;
  runName?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}
