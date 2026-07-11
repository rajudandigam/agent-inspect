import crypto from "node:crypto";

import type { InspectKind, InspectRunTree } from "../types/inspect-event.js";

import type { ExportOptions, ExportResult } from "./types.js";
import { EXPORT_PAYLOAD_VERSION } from "./types.js";
import { flattenTree } from "./helpers.js";

export interface OpenInferenceSpan {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  name: string;
  /** Decimal string: epoch-nanosecond values exceed Number.MAX_SAFE_INTEGER. */
  start_time_unix_nano: string;
  end_time_unix_nano?: string;
  attributes: Record<string, unknown>;
  status?: {
    code: "OK" | "ERROR" | "UNSET";
    message?: string;
  };
}

export interface OpenInferenceExport {
  exporter: "agent-inspect";
  format: "openinference";
  compatibility: "openinference-compatible";
  version: string;
  trace_id: string;
  spans: OpenInferenceSpan[];
  warnings: string[];
}

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

function mapInspectKindToOI(
  kind: InspectKind,
  warnings: string[],
): { openInferenceKind: string; ambiguousNote?: string } {
  switch (kind) {
    case "LLM":
      return { openInferenceKind: "LLM" };
    case "TOOL":
      return { openInferenceKind: "TOOL" };
    case "CHAIN":
      return { openInferenceKind: "CHAIN" };
    case "RETRIEVER":
      return { openInferenceKind: "RETRIEVER" };
    case "AGENT":
      return { openInferenceKind: "AGENT" };
    case "DECISION":
      warnings.push(
        `Ambiguous kind DECISION mapped to CHAIN for span compatibility (${EXPORT_PAYLOAD_VERSION}).`,
      );
      return { openInferenceKind: "CHAIN" };
    case "RESULT":
      warnings.push(
        `Ambiguous kind RESULT mapped to UNKNOWN for span compatibility (${EXPORT_PAYLOAD_VERSION}).`,
      );
      return { openInferenceKind: "UNKNOWN" };
    case "ERROR":
      warnings.push(`ERROR kind mapped to CHAIN for span compatibility.`);
      return { openInferenceKind: "CHAIN" };
    case "LOG":
    case "LOGIC":
    case "RUN":
      warnings.push(`${kind} mapped to CHAIN for span compatibility.`);
      return { openInferenceKind: "CHAIN" };
    default:
      warnings.push(`Unhandled InspectKind ${kind} mapped to UNKNOWN.`);
      return { openInferenceKind: "UNKNOWN" };
  }
}

export function exportOpenInference(
  tree: InspectRunTree,
  options?: Partial<ExportOptions>,
): ExportResult {
  const warnings: string[] = [
    "OpenInference-compatible JSON export is experimental until verified against specific backends.",
    "This file was generated locally and not sent anywhere.",
  ];

  const traceId = hexFrom(`trace:${tree.runId}`, 16);
  const includeAttributes = options?.includeAttributes ?? false;
  const maxLen = options?.maxAttributeLength ?? 500;
  const pretty = options?.pretty ?? true;

  const spans: OpenInferenceSpan[] = [];

  for (const n of flattenTree(tree)) {
    const ev = n.event;
    const spanId = hexFrom(`${tree.runId}:${ev.eventId}`, 8);
    const parentSpanHex = ev.parentId
      ? hexFrom(`${tree.runId}:${ev.parentId}`, 8)
      : undefined;
    const startNs = unixNano(ev.timestamp);
    let endNs: bigint | undefined;
    if (ev.durationMs !== undefined && Number.isFinite(ev.durationMs)) {
      endNs = startNs + unixNano(ev.durationMs);
    }

    const { openInferenceKind } = mapInspectKindToOI(ev.kind, warnings);

    const attrs: Record<string, unknown> = {
      "openinference.span.kind": openInferenceKind,
      "agent_inspect.kind": ev.kind,
      "agent_inspect.confidence": ev.confidence,
      "agent_inspect.source.type": ev.source.type,
      "agent_inspect.run_id": tree.runId,
      "agent_inspect.event_id": ev.eventId,
      "agent_inspect.status": ev.status ?? "unset",
    };
    if (ev.durationMs !== undefined) {
      attrs["agent_inspect.duration_ms"] = ev.durationMs;
    }

    const meta = ev.attributes;
    if (meta?.model !== undefined && typeof meta.model === "string") {
      attrs["llm.model_name"] = meta.model;
    }
    const tokens = meta?.tokens;
    if (tokens && typeof tokens === "object" && tokens !== null) {
      const inp = (tokens as { input?: number }).input;
      const outp = (tokens as { output?: number }).output;
      if (typeof inp === "number") attrs["llm.token_count.prompt"] = inp;
      if (typeof outp === "number") attrs["llm.token_count.completion"] = outp;
    }

    if (includeAttributes && meta && typeof meta === "object") {
      for (const [k, v] of Object.entries(meta)) {
        if (k === "tokens" || k === "model") continue;
        if (v !== undefined && v !== null && typeof v !== "object") {
          attrs[`agent_inspect.preview.${k}`] =
            typeof v === "string" ? v.slice(0, maxLen) : v;
        }
      }
    }

    let status: OpenInferenceSpan["status"];
    if (ev.status === "error") {
      const msg =
        meta && typeof meta.error === "object" && meta.error !== null
          ? String((meta.error as { message?: string }).message ?? "error")
          : "error";
      status = { code: "ERROR", message: msg.slice(0, maxLen) };
    } else if (ev.status === "ok") {
      status = { code: "OK" };
    } else {
      status = { code: "UNSET" };
    }

    spans.push({
      trace_id: traceId,
      span_id: spanId,
      parent_span_id: parentSpanHex,
      name: ev.name,
      start_time_unix_nano: startNs.toString(),
      end_time_unix_nano: endNs?.toString(),
      attributes: attrs,
      status,
    });
  }

  const payload: OpenInferenceExport = {
    exporter: "agent-inspect",
    format: "openinference",
    compatibility: "openinference-compatible",
    version: EXPORT_PAYLOAD_VERSION,
    trace_id: traceId,
    spans,
    warnings,
  };

  return {
    format: "openinference",
    content: JSON.stringify(payload, null, pretty ? 2 : undefined),
    contentType: "application/json",
    fileExtension: ".openinference.json",
    warnings,
  };
}
