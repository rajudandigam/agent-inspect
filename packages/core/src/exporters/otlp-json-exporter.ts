import crypto from "node:crypto";

import type { InspectKind } from "../types/inspect-event.js";
import type { InspectRunTree } from "../types/inspect-event.js";

import type { ExportOptions, ExportResult } from "./types.js";
import { flattenTree } from "./helpers.js";

/** OTLP StatusCode numeric enum (proto). */
export const OTLP_STATUS_CODE_UNSET = 0;
export const OTLP_STATUS_CODE_OK = 1;
export const OTLP_STATUS_CODE_ERROR = 2;

/** OTLP SpanKind numeric enum — INTERNAL. */
export const OTLP_SPAN_KIND_INTERNAL = 1;

function hexFrom(seed: string, byteLen: number): string {
  return crypto.createHash("sha256").update(seed, "utf8").digest("hex").slice(0, byteLen * 2);
}

/**
 * Convert epoch milliseconds to exact epoch nanoseconds. Computed in BigInt
 * because realistic epochs exceed Number.MAX_SAFE_INTEGER once scaled to
 * nanoseconds (1.7e18 vs 9.0e15), which silently loses precision in doubles.
 */
function unixNano(ms: number): bigint {
  const whole = Math.trunc(ms);
  const fractionNs = Math.round((ms - whole) * 1e6);
  return BigInt(whole) * 1_000_000n + BigInt(fractionNs);
}

function stringAttr(key: string, value: string): { key: string; value: { stringValue: string } } {
  return { key, value: { stringValue: value } };
}

function intAttr(key: string, value: number): { key: string; value: { intValue: string } } {
  return { key, value: { intValue: String(Math.trunc(value)) } };
}

function doubleAttr(key: string, value: number): { key: string; value: { doubleValue: number } } {
  return { key, value: { doubleValue: value } };
}

function boolAttr(key: string, value: boolean): { key: string; value: { boolValue: boolean } } {
  return { key, value: { boolValue: value } };
}

type OtlpAttr =
  | ReturnType<typeof stringAttr>
  | ReturnType<typeof intAttr>
  | ReturnType<typeof doubleAttr>
  | ReturnType<typeof boolAttr>;

function numberAttr(key: string, value: number): OtlpAttr {
  if (Number.isFinite(value) && !Number.isInteger(value)) {
    return doubleAttr(key, value);
  }
  return intAttr(key, value);
}

function genAiOperationName(kind: InspectKind): string | undefined {
  switch (kind) {
    case "LLM":
      return "generate_content";
    case "TOOL":
      return "execute_tool";
    case "AGENT":
      return "invoke_agent";
    default:
      return undefined;
  }
}

/** Bounded structural retry/operation identity keys (not broad attribute dump). */
const STRUCTURAL_IDENTITY_KEYS = [
  "operationId",
  "attemptId",
  "retryOf",
  "attemptNumber",
  "attempt",
] as const;

function pickBoundedIdentityString(
  bag: Record<string, unknown> | undefined,
  key: string,
  maxLen: number,
): string | undefined {
  if (!bag || typeof bag !== "object") return undefined;
  const direct = bag[key];
  if (typeof direct === "string" && direct.trim() !== "") {
    return direct.trim().slice(0, maxLen);
  }
  const nested =
    bag.metadata && typeof bag.metadata === "object"
      ? (bag.metadata as Record<string, unknown>)[key]
      : undefined;
  if (typeof nested === "string" && nested.trim() !== "") {
    return nested.trim().slice(0, maxLen);
  }
  return undefined;
}

function pickBoundedIdentityNumber(
  bag: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  if (!bag || typeof bag !== "object") return undefined;
  const direct = bag[key];
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;
  const nested =
    bag.metadata && typeof bag.metadata === "object"
      ? (bag.metadata as Record<string, unknown>)[key]
      : undefined;
  if (typeof nested === "number" && Number.isFinite(nested)) return nested;
  return undefined;
}

/**
 * Emit explicitly recorded operation/attempt/retry identity as bounded OTLP
 * attributes without enabling broad `includeAttributes`.
 */
function appendStructuralIdentityAttrs(
  attrs: OtlpAttr[],
  meta: Record<string, unknown> | undefined,
  maxLen: number,
): void {
  const operationId = pickBoundedIdentityString(meta, "operationId", maxLen);
  if (operationId !== undefined) {
    attrs.push(stringAttr("agent_inspect.operation_id", operationId));
  }
  const attemptId = pickBoundedIdentityString(meta, "attemptId", maxLen);
  if (attemptId !== undefined) {
    attrs.push(stringAttr("agent_inspect.attempt_id", attemptId));
  }
  const retryOf = pickBoundedIdentityString(meta, "retryOf", maxLen);
  if (retryOf !== undefined) {
    attrs.push(stringAttr("agent_inspect.retry_of", retryOf));
  }
  const attemptNumber =
    pickBoundedIdentityNumber(meta, "attemptNumber") ??
    pickBoundedIdentityNumber(meta, "attempt");
  if (attemptNumber !== undefined) {
    attrs.push(intAttr("agent_inspect.attempt_number", attemptNumber));
  }
}

function resolveSpanTimes(ev: {
  timestamp: number;
  durationMs?: number;
  attributes?: Record<string, unknown>;
}): { startNs: string; endNs?: string } {
  const startedAtMs =
    typeof ev.attributes?.startedAtMs === "number" &&
    Number.isFinite(ev.attributes.startedAtMs)
      ? ev.attributes.startedAtMs
      : undefined;
  const endedAtMs =
    typeof ev.attributes?.endedAtMs === "number" &&
    Number.isFinite(ev.attributes.endedAtMs)
      ? ev.attributes.endedAtMs
      : undefined;
  const startMs = startedAtMs ?? ev.timestamp;
  const startNs = String(unixNano(startMs));
  if (endedAtMs !== undefined) {
    return { startNs, endNs: String(unixNano(endedAtMs)) };
  }
  if (ev.durationMs !== undefined && Number.isFinite(ev.durationMs)) {
    return {
      startNs,
      endNs: String(unixNano(startMs) + unixNano(ev.durationMs)),
    };
  }
  return { startNs };
}

export function exportOtlpJson(
  tree: InspectRunTree,
  options?: Partial<ExportOptions>,
): ExportResult {
  const warnings: string[] = [
    "OTLP JSON export uses OTel GenAI-aligned attributes where applicable; experimental until verified against specific collectors.",
    "Not OTLP gRPC/protobuf — JSON mapping only. Generated locally; no network upload.",
    "Status and span kind use OTLP numeric enums (StatusCode 0/1/2, SpanKind INTERNAL=1).",
    "When present on source events, operationId/attemptId/retryOf/attemptNumber are emitted as bounded agent_inspect.* identity attributes (not a broad attribute dump).",
  ];

  const traceId = hexFrom(`trace:${tree.runId}`, 16);
  const includeAttributes = options?.includeAttributes ?? false;
  const maxLen = options?.maxAttributeLength ?? 500;
  const pretty = options?.pretty ?? true;

  const flat = flattenTree(tree);
  const spans: Record<string, unknown>[] = [];

  for (const n of flat) {
    const ev = n.event;
    const spanId = hexFrom(`${tree.runId}:${ev.eventId}`, 8);
    const parentSpanId = ev.parentId
      ? hexFrom(`${tree.runId}:${ev.parentId}`, 8)
      : undefined;

    const { startNs, endNs } = resolveSpanTimes(ev);

    const meta = ev.attributes;
    const originalSource =
      typeof meta?.originalSourceType === "string" && meta.originalSourceType.trim() !== ""
        ? meta.originalSourceType.trim()
        : ev.source.type;

    const attrs: OtlpAttr[] = [
      stringAttr("agent_inspect.kind", ev.kind),
      stringAttr("agent_inspect.confidence", ev.confidence),
      stringAttr("agent_inspect.source.type", originalSource),
      stringAttr("agent_inspect.run_id", tree.runId),
      stringAttr("agent_inspect.event_id", ev.eventId),
      stringAttr("agent_inspect.status", ev.status ?? "unset"),
    ];

    if (ev.durationMs !== undefined) {
      attrs.push(numberAttr("agent_inspect.duration_ms", ev.durationMs));
    }

    const op = genAiOperationName(ev.kind);
    if (op !== undefined) {
      attrs.push(stringAttr("gen_ai.operation.name", op));
    }

    const requestModel =
      (typeof meta?.model === "string" && meta.model.trim() !== "" ? meta.model : undefined) ??
      (typeof meta?.modelId === "string" && meta.modelId.trim() !== "" ? meta.modelId : undefined);
    if (requestModel !== undefined) {
      attrs.push(stringAttr("gen_ai.request.model", requestModel.slice(0, maxLen)));
    }
    const responseModel =
      typeof meta?.responseModelId === "string" && meta.responseModelId.trim() !== ""
        ? meta.responseModelId
        : typeof meta?.responseModel === "string" && meta.responseModel.trim() !== ""
          ? meta.responseModel
          : undefined;
    if (responseModel !== undefined) {
      attrs.push(stringAttr("gen_ai.response.model", responseModel.slice(0, maxLen)));
    }
    if (typeof meta?.provider === "string" && meta.provider.trim() !== "") {
      attrs.push(stringAttr("gen_ai.provider.name", meta.provider.slice(0, maxLen)));
    }

    const tokens = meta?.tokens;
    if (tokens && typeof tokens === "object" && tokens !== null) {
      const inp = (tokens as { input?: number }).input;
      const outp = (tokens as { output?: number }).output;
      if (typeof inp === "number") attrs.push(intAttr("gen_ai.usage.input_tokens", inp));
      if (typeof outp === "number") attrs.push(intAttr("gen_ai.usage.output_tokens", outp));
    }

    appendStructuralIdentityAttrs(
      attrs,
      meta && typeof meta === "object" ? (meta as Record<string, unknown>) : undefined,
      maxLen,
    );

    if (includeAttributes && meta && typeof meta === "object") {
      const skipKeys = new Set<string>([
        "tokens",
        "model",
        "modelId",
        "responseModel",
        "responseModelId",
        "provider",
        "originalSourceType",
        ...STRUCTURAL_IDENTITY_KEYS,
      ]);
      for (const [k, v] of Object.entries(meta)) {
        if (skipKeys.has(k)) continue;
        if (typeof v === "string") {
          attrs.push(stringAttr(`agent_inspect.preview.${k}`, v.slice(0, maxLen)));
        } else if (typeof v === "number" && Number.isFinite(v)) {
          attrs.push(numberAttr(`agent_inspect.preview.${k}`, v));
        } else if (typeof v === "boolean") {
          attrs.push(boolAttr(`agent_inspect.preview.${k}`, v));
        }
      }
    }

    let statusCode: number = OTLP_STATUS_CODE_UNSET;
    let statusMessage: string | undefined;
    if (ev.status === "error") {
      statusCode = OTLP_STATUS_CODE_ERROR;
      statusMessage =
        meta && typeof meta.error === "object" && meta.error !== null
          ? String((meta.error as { message?: string }).message ?? "error").slice(0, maxLen)
          : "error";
    } else if (ev.status === "ok") {
      statusCode = OTLP_STATUS_CODE_OK;
    }

    const spanJson: Record<string, unknown> = {
      traceId,
      spanId,
      name: ev.name,
      kind: OTLP_SPAN_KIND_INTERNAL,
      startTimeUnixNano: startNs,
      attributes: attrs,
      status: {
        code: statusCode,
        ...(statusMessage !== undefined ? { message: statusMessage } : {}),
      },
    };

    if (parentSpanId !== undefined) {
      spanJson.parentSpanId = parentSpanId;
    }
    if (endNs !== undefined) {
      spanJson.endTimeUnixNano = endNs;
    }

    spans.push(spanJson);
  }

  const payload = {
    resourceSpans: [
      {
        resource: {
          attributes: [stringAttr("service.name", "agent-inspect")],
        },
        scopeSpans: [
          {
            scope: { name: "agent-inspect" },
            spans,
          },
        ],
      },
    ],
  };

  return {
    format: "otlp-json",
    content: JSON.stringify(payload, null, pretty ? 2 : undefined),
    contentType: "application/json",
    fileExtension: ".otlp.json",
    warnings,
  };
}
