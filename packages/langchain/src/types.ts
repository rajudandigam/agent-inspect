import type { AdapterDiagnosticListener, RedactionProfile } from "agent-inspect/advanced";
import type { RedactionRule } from "agent-inspect/logs";

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
  /** Trace directory for JSONL. When set and `persist` is omitted, persistence is enabled. */
  traceDir?: string;
  silent?: boolean;
  capture?: CaptureMode;
  redact?: RedactionRule[];
  maxPreviewChars?: number;
  /**
   * Redaction profile applied to preview attributes before persistence.
   * `share` and `strict` also cap `maxPreviewChars`.
   *
   * @experimental Effective only when `capture: "preview"`.
   */
  redactionProfile?: RedactionProfile;
  /**
   * Receives bounded capture diagnostics such as
   * `AI_CAPTURE_FIELD_UNAVAILABLE`. Listener failures are isolated.
   *
   * @experimental
   */
  onDiagnostic?: AdapterDiagnosticListener;
  /**
   * Persist callback lifecycle as schemaVersion "0.1" JSONL.
   * When omitted: enabled if `traceDir` is set, otherwise in-memory only.
   * Explicit `false` forces in-memory even when `traceDir` is set.
   */
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
