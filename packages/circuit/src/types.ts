export type CircuitStatus = "closed" | "open" | "warn";

export interface CircuitEvidence {
  ruleId: string;
  count?: number;
  threshold?: number;
  toolName?: string;
  runId?: string;
  eventId?: string;
  path?: string;
}

export interface CircuitResult {
  ruleId: string;
  status: CircuitStatus;
  severity: "error" | "warning" | "info";
  message: string;
  evidence: CircuitEvidence[];
}

export interface CircuitRunResult {
  ok: boolean;
  results: CircuitResult[];
}

export type CircuitRuleId =
  | "circuit.same-tool-repetition"
  | "circuit.same-args-repetition"
  | "circuit.max-loop-iterations"
  | "circuit.max-retries"
  | "circuit.tool-timeout"
  | "circuit.runaway-llm-loop"
  | "circuit.excessive-branch-width";

export interface CircuitTraceEvent {
  eventId?: string;
  runId?: string;
  name: string;
  kind?: string;
  parentId?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  attributes?: Record<string, unknown>;
  status?: string;
}

export interface ThresholdRule {
  maxRepeats: number;
}

export interface MaxIterationsRule {
  maxIterations: number;
}

export interface MaxRetriesRule {
  maxRetries: number;
}

export interface ToolTimeoutRule {
  maxDurationMs: number;
}

export interface RunawayLlmLoopRule {
  maxLlmCalls: number;
}

export interface ExcessiveBranchWidthRule {
  maxWidth: number;
}

export interface RunCircuitsOptions {
  rules?: readonly CircuitRuleId[];
  sameToolRepetition?: ThresholdRule;
  sameArgsRepetition?: ThresholdRule;
  maxLoopIterations?: MaxIterationsRule;
  maxRetries?: MaxRetriesRule;
  toolTimeout?: ToolTimeoutRule;
  runawayLlmLoop?: RunawayLlmLoopRule;
  excessiveBranchWidth?: ExcessiveBranchWidthRule;
}
