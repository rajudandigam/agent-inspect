export interface TokenUsage {
  input?: number;
  output?: number;
  total?: number;
}

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
