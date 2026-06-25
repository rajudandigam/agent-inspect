# AI SDK integration proposal

**Status:** v1.7.0 chunk 1 verified against AI SDK v6 docs and `ai@6.0.210` package types.
**Purpose:** implementation-ready replacement for the earlier issue-only AI SDK adapter plan.
**Last verified:** 2026-06-25.

## Verified external contract

Sources:

- AI SDK telemetry docs: `https://ai-sdk.dev/docs/ai-sdk-core/telemetry`
- AI SDK event callback docs: `https://ai-sdk.dev/docs/ai-sdk-core/event-listeners`
- Published package types: `ai@6.0.210`

Findings:

- The current npm `latest` for `ai` is v7, but this train intentionally targets AI SDK v6. The latest v6 observed during verification is `6.0.210`.
- AI SDK telemetry is still experimental.
- `experimental_telemetry.integrations` accepts one or more `TelemetryIntegration` objects on `generateText` and `streamText`.
- Integration methods are optional and may be synchronous or return a `PromiseLike`.
- AI SDK catches errors thrown by integration listeners, so AgentInspect integration failures must not alter generation behavior.
- `bindTelemetryIntegration()` is exported from `ai` and should be used for class-based integrations so extracted methods keep their receiver.
- Input and output recording are enabled by default in AI SDK telemetry unless callers set `recordInputs: false` and `recordOutputs: false`.

## Goal

Provide an optional `@agent-inspect/ai-sdk` package that maps Vercel AI SDK telemetry/lifecycle data into local AgentInspect traces without monkey-patching providers, global fetch, or core SDK functions.

## Intended usage

```ts
import { agentInspect } from "@agent-inspect/ai-sdk";

const result = await streamText({
  model,
  prompt,
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        traceDir: ".agent-inspect",
        capture: "metadata-only",
      }),
    ],
  },
});
```

The adapter documentation must show `recordInputs: false` and `recordOutputs: false` in every telemetry example. The adapter cannot force those host-call options from inside the integration object, so examples, recipes, tests, and runtime warnings should treat them as required safe defaults.

## Capture policy

```ts
type CaptureMode = "metadata-only" | "preview" | "full";
```

Defaults:

- `metadata-only`;
- `recordInputs: false`;
- `recordOutputs: false`;
- no tool arguments/results persisted by default;
- no per-token JSONL events.

Preview mode must be explicit, bounded, and redacted.

Raw-content fields that must not be persisted in metadata-only mode:

- prompts, messages, system messages, reasoning/reasoning text, generated text, generated content, files, sources, request/response bodies;
- tool call inputs and tool outputs;
- provider request headers;
- user-defined `experimental_context`;
- arbitrary provider metadata unless summarized through an allowlist.

## Integration surface

Initial adapter shape:

```ts
import { bindTelemetryIntegration } from "ai";
import type { TelemetryIntegration } from "ai";

export function agentInspect(options: AgentInspectAiSdkOptions): TelemetryIntegration {
  return bindTelemetryIntegration(new AgentInspectAiSdkIntegration(options));
}
```

`AgentInspectAiSdkOptions` should stay dependency-light and writer-oriented:

- `writer?: TraceWriter` for explicit test/runtime injection;
- `traceDir?: string` as a convenience that constructs a v1.6 file writer in the optional package;
- `runName?: string`;
- `capture?: "metadata-only" | "preview"`;
- `redactionProfile?: "local" | "share" | "strict"`;
- `maxPreviewChars?: number`;
- `clock?: () => number` or equivalent test hook if needed for deterministic duration tests.

Do not expose an option that uploads, configures OpenTelemetry exporters, or silently enables AI SDK `recordInputs` / `recordOutputs`.

## Lifecycle mapping

| AI SDK signal | AgentInspect kind |
| --- | --- |
| generation / model call | `LLM` |
| tool call | `TOOL` |
| multi-step operation | `CHAIN` or `AGENT` depending on SDK context |
| final result | `RESULT` |
| failure | error status plus structured error |

Exact lifecycle mapping:

| AI SDK lifecycle method | Event shape verified in v6 | AgentInspect mapping |
| --- | --- | --- |
| `onStart(event)` | generation start with model, options, telemetry `functionId`, metadata, prompt/messages/tools, and `experimental_context` | start one local run, default name from `runName`, `functionId`, or model; persist only model/provider, allowed generation settings, and safe telemetry metadata |
| `onStepStart(event)` | zero-based `stepNumber`, model, messages, tools, prior steps, provider options, headers, stop conditions, output spec, telemetry metadata | start one LLM step for that `stepNumber`; preserve model/provider, generation settings, and prior-step count; do not persist messages/tools verbatim |
| `onToolCallStart(event)` | optional `stepNumber`, optional model, full typed tool call, messages, abort signal, telemetry metadata | start one tool step keyed by `toolCallId` when available; persist tool name/id and input summary only |
| `onToolCallFinish(event)` | discriminated union with `success`, `durationMs`, tool call, output on success or error on failure | complete tool step with status, duration, output summary or error summary |
| `onStepFinish(event)` | `StepResult` with step number, model, content/text/reasoning/files/sources, tool calls/results, finish reason, usage, request/response metadata, provider metadata | complete LLM step with finish reason, usage, response id/model/timestamp where available, warning count, and safe metadata summaries |
| `onFinish(event)` | final `StepResult` plus all steps, `totalUsage`, final context, telemetry metadata | complete local run with aggregate usage, final status, step count, and safe finish metadata |

Capture when available in metadata-only mode:

- model ID and provider;
- step number;
- finish reason;
- response ID;
- response model/timestamp when supplied;
- duration;
- token usage: `inputTokens`, `outputTokens`, `totalTokens`, plus any supported cached/reasoning token fields after explicit type verification;
- retries;
- streaming start/finish timing from final step metadata when exposed by AI SDK;
- first-chunk latency when exposed through stream telemetry (`ai.response.msToFirstChunk`) or a verified event field;
- chunk count only when the integration can observe it without consuming or altering the user's stream.

Do not fabricate parent/child links. If `stepNumber` or `toolCallId` is unavailable, attach the event at the safest known parent and emit a diagnostic/warning for ambiguous mapping.

## Writer/runtime strategy

Use the v1.6 local runtime and writer foundation:

- prefer `createInspector()` from `agent-inspect/advanced` plus a caller-provided or package-created writer;
- use `fileWriter()` or `bufferedFileWriter()` from `agent-inspect/writers` only inside the optional adapter package;
- write v0.2 persisted events through the writer interface; do not change manual v0.1 writer behavior;
- call `flush()` / `close()` only when the adapter owns the writer, or expose explicit lifecycle helpers for caller-owned writers;
- surface integration diagnostics without throwing into AI SDK callbacks;
- perform no network I/O.

The adapter must preserve application behavior even when cloning, summarization, writing, flushing, or closing fails.

## Package boundary

- optional package;
- peer dependency on supported AI SDK v6 versions;
- no AI SDK dependency in root `agent-inspect`;
- no OpenTelemetry SDK/exporter dependency in root/core;
- own compatibility matrix and fixtures;
- experimental adapter API during v1.x.

## Validation expectations

- generateText fixture;
- streamText fixture;
- tool call fixture;
- failed provider/tool fixture;
- multi-step fixture;
- metadata-only privacy tests;
- preview bounds/redaction tests;
- token usage preservation tests;
- integration error isolation test;
- writer failure isolation test;
- `recordInputs: false` / `recordOutputs: false` example and fixture assertions;
- ESM/CJS package smoke where applicable.

Fixtures must use AI SDK test/mocking utilities or local fake models only. No live provider calls, API keys, network calls, customer data, or raw prompts/outputs in committed fixtures.

## Release dependency

v1.6 has published and verified the runtime, writer, and reader foundation. Proceed to package scaffolding only in the dedicated v1.7 chunk after this RFC verification lands.
