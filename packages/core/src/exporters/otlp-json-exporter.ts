import crypto from "node:crypto";

import type { InspectKind } from "../types/inspect-event.js";
import type { InspectRunTree } from "../types/inspect-event.js";

import type { ExportOptions, ExportResult } from "./types.js";
import { flattenTree } from "./helpers.js";

function hexFrom(seed: string, byteLen: number): string {
  return crypto.createHash("sha256").update(seed, "utf8").digest("hex").slice(0, byteLen * 2);
}

function stringAttr(key: string, value: string): { key: string; value: { stringValue: string } } {
  return { key, value: { stringValue: value } };
}

function intAttr(key: string, value: number): { key: string; value: { intValue: string } } {
  return { key, value: { intValue: String(value) } };
}

type OtlpAttr =
  | ReturnType<typeof stringAttr>
  | ReturnType<typeof intAttr>;

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

export function exportOtlpJson(
  tree: InspectRunTree,
  options?: Partial<ExportOptions>,
): ExportResult {
  const warnings: string[] = [
    "OTLP JSON export uses OTel GenAI-aligned attributes where applicable; experimental until verified against specific collectors.",
    "Not OTLP gRPC/protobuf — JSON mapping only. Generated locally; no network upload.",
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

    const startNs = String(Math.round(ev.timestamp * 1e6));
    let endNs: string | undefined;
    if (ev.durationMs !== undefined && Number.isFinite(ev.durationMs)) {
      endNs = String(Math.round(ev.timestamp * 1e6 + ev.durationMs * 1e6));
    }

    const attrs: OtlpAttr[] = [
      stringAttr("agent_inspect.kind", ev.kind),
      stringAttr("agent_inspect.confidence", ev.confidence),
      stringAttr("agent_inspect.source.type", ev.source.type),
      stringAttr("agent_inspect.run_id", tree.runId),
      stringAttr("agent_inspect.event_id", ev.eventId),
      stringAttr("agent_inspect.status", ev.status ?? "unset"),
    ];

    if (ev.durationMs !== undefined) {
      attrs.push(intAttr("agent_inspect.duration_ms", ev.durationMs));
    }

    const op = genAiOperationName(ev.kind);
    if (op !== undefined) {
      attrs.push(stringAttr("gen_ai.operation.name", op));
    }

    const meta = ev.attributes;
    if (meta?.model !== undefined && typeof meta.model === "string") {
      attrs.push(stringAttr("gen_ai.request.model", meta.model.slice(0, maxLen)));
    }

    const tokens = meta?.tokens;
    if (tokens && typeof tokens === "object" && tokens !== null) {
      const inp = (tokens as { input?: number }).input;
      const outp = (tokens as { output?: number }).output;
      if (typeof inp === "number") attrs.push(intAttr("gen_ai.usage.input_tokens", inp));
      if (typeof outp === "number") attrs.push(intAttr("gen_ai.usage.output_tokens", outp));
    }

    if (includeAttributes && meta && typeof meta === "object") {
      for (const [k, v] of Object.entries(meta)) {
        if (k === "tokens" || k === "model") continue;
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          attrs.push(
            stringAttr(
              `agent_inspect.preview.${k}`,
              typeof v === "string" ? v.slice(0, maxLen) : String(v),
            ),
          );
        }
      }
    }

    let statusCode = "STATUS_CODE_UNSET";
    let statusMessage: string | undefined;
    if (ev.status === "error") {
      statusCode = "STATUS_CODE_ERROR";
      statusMessage =
        meta && typeof meta.error === "object" && meta.error !== null
          ? String((meta.error as { message?: string }).message ?? "error").slice(0, maxLen)
          : "error";
    } else if (ev.status === "ok") {
      statusCode = "STATUS_CODE_OK";
    }

    const spanJson: Record<string, unknown> = {
      traceId,
      spanId,
      name: ev.name,
      kind: "SPAN_KIND_INTERNAL",
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
