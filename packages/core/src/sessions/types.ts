import type { TraceMetadataStatus } from "../types.js";

/** Known session/workflow metadata keys (v2.4 RFC). */
export const SESSION_WORKFLOW_KEYS = [
  "sessionId",
  "conversationId",
  "groupId",
  "parentGroupId",
  "attempt",
  "retryOf",
  "retryReason",
  "handoffFrom",
  "handoffTo",
  "subAgentId",
  "subAgentName",
  "jobId",
  "queueName",
  "workflowName",
  "workflowStep",
  "toolCallId",
  "mcpToolCallId",
  "linkedStepId",
  "correlationId",
  "requestId",
  "decisionId",
] as const;

export type SessionWorkflowKey = (typeof SESSION_WORKFLOW_KEYS)[number];

export type SessionConfidence = "explicit" | "correlated" | "heuristic" | "unknown";

export type SessionEdgeSource =
  | "manual"
  | "adapter"
  | "json-log"
  | "log4js"
  | "mcp-client"
  | "inferred";

export interface SessionWorkflowMetadata {
  sessionId?: string;
  conversationId?: string;
  groupId?: string;
  parentGroupId?: string;
  attempt?: number;
  retryOf?: string;
  retryReason?: string;
  handoffFrom?: string;
  handoffTo?: string;
  subAgentId?: string;
  subAgentName?: string;
  jobId?: string;
  queueName?: string;
  workflowName?: string;
  workflowStep?: string;
  toolCallId?: string;
  mcpToolCallId?: string;
  linkedStepId?: string;
  correlationId?: string;
  requestId?: string;
  decisionId?: string;
}

export interface SessionRunRecord {
  runId: string;
  name?: string;
  status?: TraceMetadataStatus;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  filePath?: string;
  metadata?: Record<string, unknown>;
}

export interface SessionWarning {
  code: string;
  message: string;
  runId?: string;
  sessionId?: string;
}

export interface HandoffEdge {
  from: string;
  to: string;
  source: SessionEdgeSource;
  confidence: SessionConfidence;
}

export interface RetryLink {
  runId: string;
  retryOf?: string;
  attempt?: number;
  source: SessionEdgeSource;
  confidence: SessionConfidence;
}

export interface SessionGroup {
  groupId: string;
  parentGroupId?: string;
  runIds: string[];
}

export interface CriticalPathStep {
  runId: string;
  name?: string;
  startedAt?: number;
  durationMs?: number;
  source: SessionEdgeSource;
  confidence: SessionConfidence;
}

export interface SessionSummary {
  sessionId: string;
  runIds: string[];
  groups: SessionGroup[];
  handoffs: HandoffEdge[];
  retries: RetryLink[];
  criticalPath: CriticalPathStep[];
}

export interface SessionIndex {
  runs: SessionRunRecord[];
  sessions: SessionSummary[];
  unscopedRunIds: string[];
  warnings: SessionWarning[];
}

export interface BuildSessionIndexOptions {
  /** When true, group runs that share only `groupId` under a synthetic session key. */
  correlateByGroupId?: boolean;
}
