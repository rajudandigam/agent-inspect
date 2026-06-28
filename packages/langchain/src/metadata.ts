export interface TokenUsage {
  input?: number;
  output?: number;
  total?: number;
}

type LangGraphAlias = {
  out: string;
  aliases: readonly string[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function normalizeTokenShape(raw: Record<string, unknown>): TokenUsage | undefined {
  const input =
    num(raw.promptTokens) ??
    num(raw.inputTokens) ??
    num(raw.input_tokens) ??
    num(raw.prompt_tokens);
  const output =
    num(raw.completionTokens) ??
    num(raw.outputTokens) ??
    num(raw.output_tokens) ??
    num(raw.completion_tokens);
  let total = num(raw.totalTokens) ?? num(raw.total_tokens);

  if (total === undefined && input !== undefined && output !== undefined) {
    total = input + output;
  }

  if (input === undefined && output === undefined && total === undefined) {
    return undefined;
  }

  const out: TokenUsage = {};
  if (input !== undefined) out.input = input;
  if (output !== undefined) out.output = output;
  if (total !== undefined) out.total = total;
  return out;
}

/** Extract token usage from LangChain / provider-shaped LLM outputs. Never throws. */
export function extractTokenUsage(output: unknown): TokenUsage | undefined {
  try {
    if (!isRecord(output)) return undefined;

    const candidates: unknown[] = [
      isRecord(output.llmOutput) ? output.llmOutput.tokenUsage : undefined,
      isRecord(output.llmOutput) ? output.llmOutput.estimatedTokenUsage : undefined,
      output.usage_metadata,
      isRecord(output.response_metadata) ? output.response_metadata.tokenUsage : undefined,
      isRecord(output.response_metadata) ? output.response_metadata.token_usage : undefined,
    ];

    for (const c of candidates) {
      if (!isRecord(c)) continue;
      const norm = normalizeTokenShape(c);
      if (norm) return norm;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function readLcKwargs(serializedOrOutput: unknown): Record<string, unknown> | undefined {
  if (!isRecord(serializedOrOutput)) return undefined;
  const lc = serializedOrOutput.lc_kwargs ?? serializedOrOutput.kwargs;
  return isRecord(lc) ? lc : undefined;
}

/** Best-effort model name from serialized LLM / chat model or provider metadata. */
export function extractModelName(serializedOrOutput: unknown): string | undefined {
  try {
    const lc = readLcKwargs(serializedOrOutput);
    const fromLc =
      (lc?.model as string | undefined) ??
      (lc?.modelName as string | undefined) ??
      (lc?.model_name as string | undefined);

    if (typeof fromLc === "string" && fromLc.trim()) return fromLc;

    if (isRecord(serializedOrOutput)) {
      for (const k of ["model", "modelName", "model_name"] as const) {
        const v = serializedOrOutput[k];
        if (typeof v === "string" && v.trim()) return v;
      }
      const rm = serializedOrOutput.response_metadata;
      if (isRecord(rm)) {
        const m = rm.model_name ?? rm.model;
        if (typeof m === "string" && m.trim()) return m;
      }
      const lo = serializedOrOutput.llmOutput;
      if (isRecord(lo)) {
        const m = lo.model_name;
        if (typeof m === "string" && m.trim()) return m;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/** Safe truncated string preview for logging-style fields. */
export function safePreview(value: unknown, maxChars: number): string | undefined {
  try {
    if (maxChars <= 0) return undefined;
    const seen = new WeakSet<object>();
    const json = JSON.stringify(value, (_k, v) => {
      if (typeof v === "bigint") return v.toString();
      if (typeof v === "function" || typeof v === "symbol") return undefined;
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    });
    if (json === undefined) return undefined;
    if (json.length <= maxChars) return json;
    return `${json.slice(0, maxChars)}…`;
  } catch {
    try {
      const s = String(value);
      if (s.length <= maxChars) return s;
      return `${s.slice(0, maxChars)}…`;
    } catch {
      return undefined;
    }
  }
}

const MAX_METADATA_KEYS = 40;

const LANGGRAPH_ALIASES: readonly LangGraphAlias[] = [
  { out: "graphId", aliases: ["graphId", "graph_id", "langgraph_graph_id"] },
  { out: "graphName", aliases: ["graphName", "graph_name", "langgraph_graph_name"] },
  { out: "nodeId", aliases: ["nodeId", "node_id", "langgraph_node_id"] },
  { out: "nodeName", aliases: ["nodeName", "node_name", "langgraph_node"] },
  { out: "subgraphId", aliases: ["subgraphId", "subgraph_id", "langgraph_subgraph_id"] },
  { out: "subgraphName", aliases: ["subgraphName", "subgraph_name", "langgraph_subgraph"] },
  { out: "taskId", aliases: ["taskId", "task_id", "langgraph_task_id"] },
  { out: "taskName", aliases: ["taskName", "task_name", "langgraph_task"] },
  { out: "graphStep", aliases: ["graphStep", "graph_step", "langgraph_step"] },
  { out: "streamMode", aliases: ["streamMode", "stream_mode", "langgraph_stream_mode"] },
  { out: "branch", aliases: ["branch", "branchName", "branch_name", "langgraph_branch"] },
  { out: "branchPath", aliases: ["branchPath", "branch_path", "langgraph_path"] },
  { out: "branchIndex", aliases: ["branchIndex", "branch_index", "langgraph_branch_index"] },
  {
    out: "parallelGroupId",
    aliases: ["parallelGroupId", "parallel_group_id", "langgraph_parallel_group_id"],
  },
  { out: "checkpointId", aliases: ["checkpointId", "checkpoint_id", "langgraph_checkpoint_id"] },
  {
    out: "checkpointNamespace",
    aliases: ["checkpointNamespace", "checkpoint_ns", "langgraph_checkpoint_ns"],
  },
  { out: "threadId", aliases: ["threadId", "thread_id", "langgraph_thread_id"] },
  { out: "sessionId", aliases: ["sessionId", "session_id", "langgraph_session_id"] },
  { out: "retryAttempt", aliases: ["retryAttempt", "retry_attempt", "attempt"] },
  { out: "handoffFrom", aliases: ["handoffFrom", "handoff_from", "langgraph_handoff_from"] },
  { out: "handoffTo", aliases: ["handoffTo", "handoff_to", "langgraph_handoff_to"] },
] as const;

const LANGGRAPH_SUMMARY_ALIASES: readonly LangGraphAlias[] = [
  { out: "checkpointSummary", aliases: ["checkpoint", "langgraph_checkpoint"] },
  { out: "branchSummary", aliases: ["branches", "langgraph_branches", "langgraph_triggers"] },
  { out: "subgraphSummary", aliases: ["subgraphs", "langgraph_subgraphs"] },
  { out: "taskSummary", aliases: ["tasks", "langgraph_tasks"] },
] as const;

function boundedValue(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value === "string") return value.length <= 200 ? value : `${value.slice(0, 200)}…`;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) {
    const items = value.slice(0, 10).map((item) => {
      if (item === null) return null;
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
        return item;
      }
      if (typeof item === "bigint") return item.toString();
      return summarizeValue(item);
    });
    return {
      type: "array",
      itemCount: value.length,
      items,
      truncated: value.length > items.length ? true : undefined,
    };
  }
  return summarizeValue(value);
}

function summarizeValue(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return { type: "array", itemCount: value.length };
  if (isRecord(value)) return { type: "object", keyCount: Object.keys(value).length };
  return { type: typeof value };
}

function getAliasValue(
  sources: readonly Record<string, unknown>[],
  aliases: readonly string[],
): unknown {
  for (const source of sources) {
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(source, alias)) {
        return source[alias];
      }
    }
  }
  return undefined;
}

/** Shallow plain metadata: drops functions/symbols; avoids deep nesting. Never throws. */
export function toPlainMetadata(value: unknown): Record<string, unknown> {
  try {
    if (!isRecord(value)) return {};
    const out: Record<string, unknown> = {};
    let n = 0;
    for (const [k, v] of Object.entries(value)) {
      if (n >= MAX_METADATA_KEYS) break;
      if (typeof v === "function" || typeof v === "symbol") continue;
      if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        out[k] = v;
        n++;
        continue;
      }
      if (typeof v === "bigint") {
        out[k] = v.toString();
        n++;
        continue;
      }
      if (Array.isArray(v)) {
        out[k] = `array(${v.length})`;
        n++;
        continue;
      }
      if (isRecord(v)) {
        out[k] = "[object]";
        n++;
        continue;
      }
      out[k] = String(v);
      n++;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Extract bounded LangGraph identity metadata from LangChain callback metadata.
 *
 * The helper preserves known graph/node/task/session identifiers and summarizes
 * potentially large graph state containers instead of copying raw state.
 */
export function extractLangGraphMetadata(value: unknown): Record<string, unknown> | undefined {
  try {
    if (!isRecord(value)) return undefined;
    const sources: Record<string, unknown>[] = [value];
    for (const key of ["langgraph", "configurable"] as const) {
      const nested = value[key];
      if (isRecord(nested)) sources.push(nested);
    }
    const langGraph = value.langgraph;
    if (isRecord(langGraph)) {
      const configurable = langGraph.configurable;
      if (isRecord(configurable)) sources.push(configurable);
      const nestedConfig = langGraph.config;
      if (isRecord(nestedConfig) && isRecord(nestedConfig.configurable)) {
        sources.push(nestedConfig.configurable);
      }
    }
    const config = value.config;
    if (isRecord(config) && isRecord(config.configurable)) {
      sources.push(config.configurable);
    }

    const out: Record<string, unknown> = {};
    for (const { out: outKey, aliases } of LANGGRAPH_ALIASES) {
      const raw = getAliasValue(sources, aliases);
      if (raw !== undefined) out[outKey] = boundedValue(raw);
    }
    for (const { out: outKey, aliases } of LANGGRAPH_SUMMARY_ALIASES) {
      const raw = getAliasValue(sources, aliases);
      if (raw !== undefined) out[outKey] = summarizeValue(raw);
    }

    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}
