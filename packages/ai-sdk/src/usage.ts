import type { PersistedTokenUsage } from "agent-inspect/persisted";

export type AiSdkUsage = {
  inputTokens?: number | Record<string, unknown>;
  outputTokens?: number | Record<string, unknown>;
  totalTokens?: number;
  cachedInputTokens?: number;
  inputTokenDetails?: Record<string, unknown>;
  outputTokenDetails?: Record<string, unknown>;
  input?: number;
  output?: number;
  total?: number;
  cached?: number;
  cacheWrite?: number;
  reasoning?: number;
};

function nonNegativeFinite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function isUsageRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Map AI SDK flat or nested V3 usage into persisted token vocabulary (no pricing). */
export function summarizeAiSdkUsage(
  usage: AiSdkUsage | undefined,
): PersistedTokenUsage | undefined {
  if (!usage) return undefined;

  let input = nonNegativeFinite(usage.inputTokens) ?? nonNegativeFinite(usage.input);
  let output =
    nonNegativeFinite(usage.outputTokens) ?? nonNegativeFinite(usage.output);
  let total = nonNegativeFinite(usage.totalTokens) ?? nonNegativeFinite(usage.total);
  let cached =
    nonNegativeFinite(usage.cachedInputTokens) ?? nonNegativeFinite(usage.cached);
  let cacheWrite = nonNegativeFinite(usage.cacheWrite);
  let reasoning = nonNegativeFinite(usage.reasoning);

  if (isUsageRecord(usage.inputTokens)) {
    input = nonNegativeFinite(usage.inputTokens.total) ?? input;
    cached =
      nonNegativeFinite(usage.inputTokens.cacheRead) ??
      nonNegativeFinite(usage.inputTokens.cache_read) ??
      cached;
    cacheWrite =
      nonNegativeFinite(usage.inputTokens.cacheWrite) ??
      nonNegativeFinite(usage.inputTokens.cache_write) ??
      nonNegativeFinite(usage.inputTokens.cacheCreation) ??
      cacheWrite;
  }

  if (isUsageRecord(usage.outputTokens)) {
    output = nonNegativeFinite(usage.outputTokens.total) ?? output;
    reasoning =
      nonNegativeFinite(usage.outputTokens.reasoning) ??
      nonNegativeFinite(usage.outputTokens.reasoningTokens) ??
      reasoning;
  }

  if (isUsageRecord(usage.inputTokenDetails)) {
    cached =
      nonNegativeFinite(usage.inputTokenDetails.cacheReadTokens) ??
      nonNegativeFinite(usage.inputTokenDetails.cacheRead) ??
      cached;
    cacheWrite =
      nonNegativeFinite(usage.inputTokenDetails.cacheWriteTokens) ??
      nonNegativeFinite(usage.inputTokenDetails.cacheWrite) ??
      cacheWrite;
  }

  if (isUsageRecord(usage.outputTokenDetails)) {
    reasoning =
      nonNegativeFinite(usage.outputTokenDetails.reasoningTokens) ??
      nonNegativeFinite(usage.outputTokenDetails.reasoning) ??
      reasoning;
  }

  const tokenUsage: PersistedTokenUsage = {};
  if (input !== undefined) tokenUsage.input = input;
  if (output !== undefined) tokenUsage.output = output;
  if (total !== undefined) tokenUsage.total = total;
  if (cached !== undefined) tokenUsage.cached = cached;
  if (cacheWrite !== undefined) tokenUsage.cacheWrite = cacheWrite;
  if (reasoning !== undefined) tokenUsage.reasoning = reasoning;

  return Object.keys(tokenUsage).length > 0 ? tokenUsage : undefined;
}
