export type AttributionConfidence =
  | "explicit"
  | "correlated"
  | "heuristic"
  | "unknown";

export type InspectKind =
  | "RUN"
  | "AGENT"
  | "LLM"
  | "TOOL"
  | "CHAIN"
  | "RETRIEVER"
  | "DECISION"
  | "RESULT"
  | "ERROR"
  | "LOGIC"
  | "LOG"
  | "OUTCOME";

export interface EventSource {
  type: "manual" | "json-log" | "log4js" | "pino" | "winston" | "adapter";
  file?: string;
  line?: number;
}

export interface InspectEvent {
  eventId: string;
  runId: string;
  parentId?: string;
  name: string;
  kind: InspectKind;
  timestamp: number;
  status?: "running" | "ok" | "error";
  durationMs?: number;
  attributes?: Record<string, unknown>;
  confidence: AttributionConfidence;
  source: EventSource;
}

export interface InspectNode {
  event: InspectEvent;
  children: InspectNode[];
  depth: number;
}

export interface InspectRunTree {
  runId: string;
  name?: string;
  status?: "running" | "ok" | "error";
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  children: InspectNode[];
  metadata: {
    totalEvents: number;
    confidenceBreakdown: Record<AttributionConfidence, number>;
    kinds: Record<InspectKind, number>;
  };
}

