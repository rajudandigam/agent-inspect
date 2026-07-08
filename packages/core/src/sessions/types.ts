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

/** Session lifecycle status (v4.2 RFC). */
export type SessionStatus =
  | "running"
  | "waiting_input"
  | "idle"
  | "completed"
  | "error"
  | "stale"
  | "unknown";

export interface SessionLastError {
  runId: string;
  message: string;
  code?: string;
}

export interface SessionCheckSummary {
  pass: number;
  fail: number;
  warn: number;
}

export interface EnrichSessionSummaryOptions {
  /** Reference clock for staleness (default Date.now()). */
  nowMs?: number;
  /** Inactivity threshold before marking a session stale (default 24h). */
  staleThresholdMs?: number;
}

export interface ActivityEntry {
  sessionId: string;
  status: SessionStatus;
  summary: string;
  lastActivity: string;
  runCount: number;
}

export interface ActivitySummary {
  since: string;
  sessions: number;
  failed: number;
  stale: number;
  guardrailWarnings: number;
  entries: ActivityEntry[];
}

export interface BuildActivitySummaryOptions {
  /** Duration window (e.g. 7d, 24h). Default 7d. */
  since?: string;
  /** Reference clock (default Date.now()). */
  nowMs?: number;
  /** Max entries returned (default 20). */
  limit?: number;
}

export interface SessionSummary {
  sessionId: string;
  runIds: string[];
  groups: SessionGroup[];
  handoffs: HandoffEdge[];
  retries: RetryLink[];
  criticalPath: CriticalPathStep[];
  /** Derived session status (v4.2+). */
  status: SessionStatus;
  /** Earliest run start time in the session. */
  startedAt?: number;
  /** Latest run end time when all runs have ended. */
  endedAt?: number;
  /** endedAt - startedAt when both are present. */
  durationMs?: number;
  correlationId?: string;
  jobId?: string;
  workflowId?: string;
  lastError?: SessionLastError;
  /** ISO-8601 timestamp of the most recent run activity. */
  lastActivity: string;
  retryCount: number;
  observationSummary?: string;
  checkSummary?: SessionCheckSummary;
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
  /** Reference clock for session staleness (v4.2+). */
  nowMs?: number;
  /** Inactivity threshold before marking a session stale (v4.2+, default 24h). */
  staleThresholdMs?: number;
}
