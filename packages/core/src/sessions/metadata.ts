import type { SessionWorkflowMetadata } from "./types.js";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function finitePositiveInt(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return undefined;
  }
  return Math.trunc(value);
}

/** Extracts session/workflow metadata from a run metadata or attributes bag. */
export function extractSessionWorkflowMetadata(
  record: Record<string, unknown> | undefined,
): SessionWorkflowMetadata | undefined {
  if (!record) return undefined;

  const out: SessionWorkflowMetadata = {};
  let found = false;

  const assignString = (
    key: Exclude<keyof SessionWorkflowMetadata, "attempt">,
    value: unknown,
  ): void => {
    if (isNonEmptyString(value)) {
      out[key] = value.trim();
      found = true;
    }
  };

  assignString("sessionId", record.sessionId);
  assignString("conversationId", record.conversationId);
  assignString("groupId", record.groupId);
  assignString("parentGroupId", record.parentGroupId);
  assignString("retryOf", record.retryOf);
  assignString("retryReason", record.retryReason);
  assignString("handoffFrom", record.handoffFrom);
  assignString("handoffTo", record.handoffTo);
  assignString("subAgentId", record.subAgentId);
  assignString("subAgentName", record.subAgentName);
  assignString("jobId", record.jobId);
  assignString("queueName", record.queueName);
  assignString("workflowName", record.workflowName);
  assignString("workflowStep", record.workflowStep);
  assignString("toolCallId", record.toolCallId);
  assignString("mcpToolCallId", record.mcpToolCallId);
  assignString("linkedStepId", record.linkedStepId);
  assignString("correlationId", record.correlationId);
  assignString("requestId", record.requestId);
  assignString("decisionId", record.decisionId);

  const attempt = finitePositiveInt(record.attempt);
  if (attempt !== undefined) {
    out.attempt = attempt;
    found = true;
  }

  return found ? out : undefined;
}

export function sessionKeyForRun(
  meta: SessionWorkflowMetadata | undefined,
  options?: { correlateByGroupId?: boolean },
): string | undefined {
  if (meta?.sessionId) return meta.sessionId;
  if (options?.correlateByGroupId && meta?.groupId) {
    return `group:${meta.groupId}`;
  }
  return undefined;
}
