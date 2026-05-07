import type { AgentAction, AgentFinish } from "@langchain/core/agents";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import type { ChainValues } from "@langchain/core/utils/types";

/** Subpaths like `@langchain/core/messages/base` are not package exports; derive from the handler contract. */
type ChatModelMessages = Parameters<
  NonNullable<BaseCallbackHandler["handleChatModelStart"]>
>[1];
type RetrieverDocuments = Parameters<
  NonNullable<BaseCallbackHandler["handleRetrieverEnd"]>
>[0];
import { Redactor, type InspectEvent, type InspectKind } from "agent-inspect";

import {
  extractModelName,
  extractTokenUsage,
  safePreview,
  toPlainMetadata,
} from "./metadata.js";
import type { AgentInspectCallbackOptions } from "./types.js";

type StartEntry = { ts: number; kind: InspectKind };

function serializedLabel(s: Serialized): string | undefined {
  if (typeof s.name === "string" && s.name.trim()) return s.name;
  if (Array.isArray(s.id) && s.id.length > 0) return s.id[s.id.length - 1];
  return s.type;
}

function errorShape(err: unknown): { errorName?: string; errorMessage: string } {
  if (err instanceof Error) {
    return { errorName: err.name, errorMessage: err.message };
  }
  return { errorMessage: String(err) };
}

export class AgentInspectCallback extends BaseCallbackHandler {
  name = "agent-inspect";

  readonly #opts: Required<
    Pick<AgentInspectCallbackOptions, "capture" | "silent" | "maxPreviewChars">
  > &
    AgentInspectCallbackOptions;

  readonly #redactor: Redactor;
  #events: InspectEvent[] = [];
  readonly #starts = new Map<string, StartEntry>();
  #rootRunId?: string;

  constructor(options: AgentInspectCallbackOptions = {}) {
    super({});
    this.#opts = {
      capture: options.capture ?? "metadata-only",
      silent: options.silent ?? false,
      maxPreviewChars: options.maxPreviewChars ?? 200,
      ...options,
    };
    this.#redactor = new Redactor({ rules: this.#opts.redact });
  }

  getEvents(): InspectEvent[] {
    return this.#events.map((e) => ({
      ...e,
      attributes: e.attributes ? { ...e.attributes } : undefined,
      source: { ...e.source },
    }));
  }

  clear(): void {
    this.#events = [];
    this.#starts.clear();
    this.#rootRunId = undefined;
  }

  #ensureRoot(lcRunId: string, parentRunId?: string): void {
    if (parentRunId) return;
    if (!this.#rootRunId) this.#rootRunId = lcRunId;
  }

  #traceRunId(lcRunId: string): string {
    return this.#rootRunId ?? lcRunId;
  }

  #durationFor(lcRunId: string): number | undefined {
    const s = this.#starts.get(lcRunId);
    if (!s) return undefined;
    return Date.now() - s.ts;
  }

  #rememberStart(lcRunId: string, kind: InspectKind): void {
    this.#starts.set(lcRunId, { ts: Date.now(), kind });
  }

  #clearStart(lcRunId: string): void {
    this.#starts.delete(lcRunId);
  }

  #baseAttrs(
    lcRunId: string,
    parentRunId: string | undefined,
    tags: string[] | undefined,
    runNameArg: string | undefined,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {
      langchainRunId: lcRunId,
    };
    if (parentRunId) out.parentRunId = parentRunId;
    if (this.#opts.runName) out.adapterRunName = this.#opts.runName;
    if (runNameArg) out.runName = runNameArg;
    if (this.#opts.traceDir) out.traceDir = this.#opts.traceDir;
    const cap = this.#opts.capture;
    if (cap !== "none" && tags?.length) out.tags = [...tags];
    return out;
  }

  #mergeMetadata(
    attrs: Record<string, unknown>,
    metadata: Record<string, unknown> | undefined,
  ): void {
    if (this.#opts.capture === "none" || !metadata) return;
    attrs.metadata = this.#redactor.redactRecord(toPlainMetadata(metadata));
  }

  #applyPreview(attrs: Record<string, unknown>, previews: Record<string, unknown>): void {
    if (this.#opts.capture !== "preview") return;
    const max = this.#opts.maxPreviewChars;
    for (const [k, v] of Object.entries(previews)) {
      const p = safePreview(v, max);
      if (p !== undefined) attrs[k] = p;
    }
  }

  #pushEvent(ev: InspectEvent): void {
    try {
      const attributes = ev.attributes
        ? this.#redactor.redactRecord({ ...ev.attributes })
        : undefined;
      this.#events.push({ ...ev, attributes });
    } catch (err) {
      if (!this.#opts.silent) {
        console.error("[agent-inspect:langchain]", err);
      }
    }
  }

  override async handleChainStart(
    chain: Serialized,
    inputs: ChainValues,
    runId: string,
    runType?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runName?: string,
    parentRunId?: string,
    _extra?: Record<string, unknown>,
  ): Promise<void> {
    void runType;
    this.#ensureRoot(runId, parentRunId);
    this.#rememberStart(runId, "CHAIN");
    const label = serializedLabel(chain) ?? "chain";
    const previews: Record<string, unknown> = {};
    if (this.#opts.capture === "preview") previews.inputPreview = inputs;
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, runName),
    };
    this.#mergeMetadata(attrs, metadata);
    this.#applyPreview(attrs, previews);
    this.#pushEvent({
      eventId: `${runId}:CHAIN:start`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: `chain:${runName ?? label}`,
      kind: "CHAIN",
      timestamp: Date.now(),
      status: "running",
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleChainEnd(
    outputs: ChainValues,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    _kwargs?: { inputs?: Record<string, unknown> },
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    const durationMs = this.#durationFor(runId);
    this.#clearStart(runId);
    const previews: Record<string, unknown> = {};
    if (this.#opts.capture === "preview") previews.outputPreview = outputs;
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
    };
    this.#applyPreview(attrs, previews);
    this.#pushEvent({
      eventId: `${runId}:CHAIN:end`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: "chain:end",
      kind: "CHAIN",
      timestamp: Date.now(),
      status: "ok",
      durationMs,
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleChainError(
    err: unknown,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    _kwargs?: { inputs?: Record<string, unknown> },
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    const durationMs = this.#durationFor(runId);
    this.#clearStart(runId);
    const { errorName, errorMessage } = errorShape(err);
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
      errorName,
      errorMessage,
    };
    this.#pushEvent({
      eventId: `${runId}:CHAIN:error`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: "chain:error",
      kind: "CHAIN",
      timestamp: Date.now(),
      status: "error",
      durationMs,
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleLLMStart(
    llm: Serialized,
    prompts: string[],
    runId: string,
    parentRunId?: string,
    _extraParams?: Record<string, unknown>,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runName?: string,
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    this.#rememberStart(runId, "LLM");
    const model = extractModelName(llm);
    const previews: Record<string, unknown> = {};
    if (this.#opts.capture === "preview") {
      previews.promptPreview = prompts.length === 1 ? prompts[0] : prompts;
    }
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, runName),
    };
    if (model && this.#opts.capture !== "none") attrs.model = model;
    this.#mergeMetadata(attrs, metadata);
    this.#applyPreview(attrs, previews);
    this.#pushEvent({
      eventId: `${runId}:LLM:start`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: `llm:${model ?? "llm"}`,
      kind: "LLM",
      timestamp: Date.now(),
      status: "running",
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleChatModelStart(
    llm: Serialized,
    messages: ChatModelMessages,
    runId: string,
    parentRunId?: string,
    _extraParams?: Record<string, unknown>,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runName?: string,
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    this.#rememberStart(runId, "LLM");
    const model = extractModelName(llm);
    const previews: Record<string, unknown> = {};
    if (this.#opts.capture === "preview") previews.inputPreview = messages;
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, runName),
    };
    if (model && this.#opts.capture !== "none") attrs.model = model;
    this.#mergeMetadata(attrs, metadata);
    this.#applyPreview(attrs, previews);
    this.#pushEvent({
      eventId: `${runId}:CHAT:start`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: `llm:${model ?? "llm"}`,
      kind: "LLM",
      timestamp: Date.now(),
      status: "running",
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleLLMEnd(
    output: LLMResult,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    _extraParams?: Record<string, unknown>,
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    const durationMs = this.#durationFor(runId);
    this.#clearStart(runId);
    const tokens = extractTokenUsage(output);
    const model = extractModelName(output);
    const previews: Record<string, unknown> = {};
    if (this.#opts.capture === "preview") previews.outputPreview = output;
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
    };
    if (model && this.#opts.capture !== "none") attrs.model = model;
    if (tokens && this.#opts.capture !== "none") attrs.tokens = tokens;
    this.#applyPreview(attrs, previews);
    this.#pushEvent({
      eventId: `${runId}:LLM:end`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: `llm:${model ?? "llm"}`,
      kind: "LLM",
      timestamp: Date.now(),
      status: "ok",
      durationMs,
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleLLMError(
    err: unknown,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    _extraParams?: Record<string, unknown>,
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    const durationMs = this.#durationFor(runId);
    this.#clearStart(runId);
    const { errorName, errorMessage } = errorShape(err);
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
      errorName,
      errorMessage,
    };
    this.#pushEvent({
      eventId: `${runId}:LLM:error`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: "llm:error",
      kind: "LLM",
      timestamp: Date.now(),
      status: "error",
      durationMs,
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleToolStart(
    tool: Serialized,
    input: string,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runName?: string,
    _toolCallId?: string,
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    this.#rememberStart(runId, "TOOL");
    const toolName = serializedLabel(tool) ?? "tool";
    const previews: Record<string, unknown> = {};
    if (this.#opts.capture === "preview") previews.inputPreview = input;
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, runName),
      tool: toolName,
    };
    this.#mergeMetadata(attrs, metadata);
    this.#applyPreview(attrs, previews);
    this.#pushEvent({
      eventId: `${runId}:TOOL:start`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: `tool:${toolName}`,
      kind: "TOOL",
      timestamp: Date.now(),
      status: "running",
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleToolEnd(
    output: unknown,
    runId: string,
    parentRunId?: string,
    tags?: string[],
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    const durationMs = this.#durationFor(runId);
    this.#clearStart(runId);
    const previews: Record<string, unknown> = {};
    if (this.#opts.capture === "preview") previews.outputPreview = output;
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
    };
    this.#applyPreview(attrs, previews);
    this.#pushEvent({
      eventId: `${runId}:TOOL:end`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: "tool:end",
      kind: "TOOL",
      timestamp: Date.now(),
      status: "ok",
      durationMs,
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleToolError(
    err: unknown,
    runId: string,
    parentRunId?: string,
    tags?: string[],
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    const durationMs = this.#durationFor(runId);
    this.#clearStart(runId);
    const { errorName, errorMessage } = errorShape(err);
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
      errorName,
      errorMessage,
    };
    this.#pushEvent({
      eventId: `${runId}:TOOL:error`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: "tool:error",
      kind: "TOOL",
      timestamp: Date.now(),
      status: "error",
      durationMs,
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleRetrieverStart(
    retriever: Serialized,
    _query: string,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
    name?: string,
  ): Promise<void> {
    void _query;
    this.#ensureRoot(runId, parentRunId);
    this.#rememberStart(runId, "RETRIEVER");
    const rname = name ?? serializedLabel(retriever) ?? "retriever";
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
      retriever: rname,
    };
    this.#mergeMetadata(attrs, metadata);
    this.#pushEvent({
      eventId: `${runId}:RETRIEVER:start`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: `retriever:${rname}`,
      kind: "RETRIEVER",
      timestamp: Date.now(),
      status: "running",
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleRetrieverEnd(
    documents: RetrieverDocuments,
    runId: string,
    parentRunId?: string,
    tags?: string[],
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    const durationMs = this.#durationFor(runId);
    this.#clearStart(runId);
    const previews: Record<string, unknown> = {};
    if (this.#opts.capture === "preview" && documents.length > 0) {
      previews.documentPreview = documents.slice(0, 3);
    }
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
      documentCount: documents.length,
    };
    this.#applyPreview(attrs, previews);
    this.#pushEvent({
      eventId: `${runId}:RETRIEVER:end`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: "retriever:end",
      kind: "RETRIEVER",
      timestamp: Date.now(),
      status: "ok",
      durationMs,
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleRetrieverError(
    err: unknown,
    runId: string,
    parentRunId?: string,
    tags?: string[],
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    const durationMs = this.#durationFor(runId);
    this.#clearStart(runId);
    const { errorName, errorMessage } = errorShape(err);
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
      errorName,
      errorMessage,
    };
    this.#pushEvent({
      eventId: `${runId}:RETRIEVER:error`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: "retriever:error",
      kind: "RETRIEVER",
      timestamp: Date.now(),
      status: "error",
      durationMs,
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleAgentAction(
    action: AgentAction,
    runId: string,
    parentRunId?: string,
    tags?: string[],
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
      tool: action.tool,
    };
    if (this.#opts.capture === "preview") {
      this.#applyPreview(attrs, {
        toolInputPreview: action.toolInput,
        logPreview: action.log,
      });
    }
    this.#pushEvent({
      eventId: `${runId}:AGENT:action:${Date.now()}`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: "agent:action",
      kind: "DECISION",
      timestamp: Date.now(),
      status: "ok",
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }

  override async handleAgentEnd(
    finish: AgentFinish,
    runId: string,
    parentRunId?: string,
    tags?: string[],
  ): Promise<void> {
    this.#ensureRoot(runId, parentRunId);
    const attrs: Record<string, unknown> = {
      ...this.#baseAttrs(runId, parentRunId, tags, undefined),
    };
    if (this.#opts.capture === "preview") {
      this.#applyPreview(attrs, {
        outputPreview: finish.returnValues,
        logPreview: finish.log,
      });
    }
    this.#pushEvent({
      eventId: `${runId}:AGENT:end:${Date.now()}`,
      runId: this.#traceRunId(runId),
      parentId: parentRunId,
      name: "agent:end",
      kind: "AGENT",
      timestamp: Date.now(),
      status: "ok",
      attributes: attrs,
      confidence: "explicit",
      source: { type: "adapter" },
    });
  }
}
