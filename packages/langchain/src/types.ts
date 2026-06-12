import type { RedactionRule } from "agent-inspect";

export type CaptureMode = "none" | "metadata-only" | "preview";

export interface LangChainStreamingOptions {
  /**
   * Capture streaming lifecycle metadata (chunk counts, duration).
   * Does not capture full token text by default.
   */
  stream?: boolean;
  /**
   * Maximum streamed preview characters when `capture: "preview"`.
   * Defaults to `maxPreviewChars` when omitted.
   */
  maxStreamPreviewChars?: number;
}

export interface AgentInspectCallbackOptions extends LangChainStreamingOptions {
  runName?: string;
  traceDir?: string;
  silent?: boolean;
  capture?: CaptureMode;
  redact?: RedactionRule[];
  maxPreviewChars?: number;
  /** When true, persist callback lifecycle as schemaVersion "0.1" JSONL (default false). */
  persist?: boolean;
  /** Optional run id for standalone persisted runs (defaults to generated id). */
  runId?: string;
}

export interface LangChainRunMetadata {
  runId: string;
  parentRunId?: string;
  runName?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}
