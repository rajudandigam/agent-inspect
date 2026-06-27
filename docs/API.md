# API (AgentInspect 1.x)

This document describes the **public TypeScript API surface** of AgentInspect and classifies each area as **stable** or **experimental**.

AgentInspect is a **local-first execution-tree debugger**. It is not a SaaS, not a production APM, not a sink/uploader, and not a replay engine.

## 1. Stability policy

- **Stable**: intended to be compatible across v1.x. Breaking changes require v2.0.
- **Experimental**: available for adoption, but subject to refinement (including naming/shape changes) before a future stability declaration. Experimental APIs may change in v1.x.

Use the root import for stable beginner APIs. Use subpaths for advanced, experimental, or lower-level workflows.

```ts
import {
  observe,
  inspectRun,
  maybeInspectRun,
  step,
  getCurrentCorrelationMetadata,
} from "agent-inspect";
```

**1.x subpath exports:** Additive subpaths (`/logs`, `/exporters`, `/persisted`, `/diff`, `/advanced`, `/writers`, `/readers`, `/checks`) narrow the import surface for experimental and advanced APIs. Root `"."` imports remain valid through v1.x. Design: [API-BOUNDARY-V1.5.md](./implementation/API-BOUNDARY-V1.5.md).

```ts
import { parseLogsToTrees } from "agent-inspect/logs";
import { exportMarkdown } from "agent-inspect/exporters";
import { memoryWriter } from "agent-inspect/writers";
import { openTrace } from "agent-inspect/readers";
import { runTraceChecks } from "agent-inspect/checks";
import { diffTraceEvents } from "agent-inspect/diff";
import { traceEventsToPersistedInspectEvents } from "agent-inspect/persisted";
import { createInspector } from "agent-inspect/advanced";
```

Notes:

- The core guarantee of v1.x is **stable local debugging**: manual tracing + CLI inspection.
- Export formats (OpenInference / OTLP JSON) are **local-only** and **compatibility-oriented**. They do **not** upload anywhere.
- There are **zero production sinks** in v1.x; sink/uploader APIs are not stable.

## 2. Stable core APIs (manual tracing)

These are the recommended entry points for manual instrumentation. They are designed to be dependency-light and safe-by-default.

Import from `agent-inspect`:

```ts
import {
  observe,
  inspectRun,
  maybeInspectRun,
  step,
  getCurrentCorrelationMetadata,
} from "agent-inspect";
```

- **`inspectRun(name, fn, options?)`**: wraps a workflow in a local JSONL trace (`run_started` / `run_completed`), prints terminal progress, and swallows instrumentation failures (user errors are re-thrown). **Traces by default** when `enabled` is omitted or `true`. Pass **`enabled: false`** to run `fn` with no trace file, no execution context, and no terminal output.
  - **`redact`**: default `true` — redacts sensitive metadata keys before disk (`authorization`, `cookie`, `token`, `apiKey`, `password`, `secret`, `email`). Pass `false` to persist metadata as-is. Pass `{ rules?: RedactionRule[] }` for custom rules (defaults still apply). **`redact: false` wins** over `redactionProfile` for trace writing.
  - **`redactionProfile`**: optional preset — `local` (default), `share`, or `strict`. Adds extra key-based redaction and tighter metadata string bounds for trace writing. Key-based only — not compliance-grade DLP.
  - **`maxMetadataValueLength`**: max string length for metadata values (default `2000`).
  - **`maxPreviewLength`**: max string length for preview-like keys containing `preview` (default `500`).
  - **`maxEventBytes`**: max UTF-8 bytes per serialized JSONL event (default `65536`). Oversized events are truncated; instrumentation never throws into user code.
  - **Correlation metadata (v1.3.0+):** optional `correlationId`, `requestId`, `decisionId`, and `groupId` strings. When set, they are written on `run_started.metadata` (not on every step). Top-level correlation options override the same keys in `options.metadata`. Useful for eval cases, CI job IDs, request tracing, and `stats --correlation-id` / `--group-id`. They are **metadata only** — they do not replace `runId`. Treat sensitive IDs as trace data before sharing exports.
- **`maybeInspectRun(name, fn, options?)`**: same as `inspectRun` when tracing is enabled; otherwise passthrough. Enablement: explicit **`options.enabled`** wins; when omitted, reads **`AGENT_INSPECT`** (`1`, `true`, `yes`, `on`, `enabled` — case-insensitive). Unset or other values disable tracing. Use in eval harnesses, CI, or jobs where tracing should be toggled by environment.
- **`isAgentInspectEnabled(value?)`**: returns whether a string (or `process.env.AGENT_INSPECT`) matches an enable token.
- **`step(name, fn, options?)`**: traces a named unit of work inside `inspectRun` (`step_started` / `step_completed`). Step `metadata` inherits the parent run's redaction and size-bound settings.
  - **`step.llm(model, fn)`**: convenience wrapper (`type: "llm"`, `metadata.model`).
  - **`step.tool(toolName, fn)`**: convenience wrapper (`type: "tool"`, `metadata.toolName`).
- **`observe(agent, options?)`**: proxy wrapper that traces top-level `run` / `execute` / `invoke` methods via `inspectRun`.
- **`getCurrentCorrelationMetadata()`**: returns active run correlation fields (`correlationId`, `requestId`, `decisionId`, `groupId`) inside `inspectRun` / `maybeInspectRun`; `undefined` outside a traced run or when none were set.
- **`RedactionProfile`**: `"local" | "share" | "strict"` — see `redactionProfile` on `InspectRunOptions` and `ExportOptions`.
- **`resolveRedactionProfile(profile?)`**: resolves profile extra keys and metadata caps (for advanced integrations).

## 3. Stable local inspection APIs

These APIs support local workflows like listing traces, extracting metadata/summaries, and safety checks for deletion.

- **`TraceDirectory`**, **`resolveTraceDir`**
- **`extractMetadata`**, **`buildRunSummary`**
- **`filterTraces`**
- **`isAgentInspectTrace`** (conservative trace verifier for cleanup)
- **`parseDuration`**, **`formatDuration`**
- Types: **`TraceMetadata`**, **`RunSummary`**

## 4. Stable event/config model types

### Manual trace JSONL model (stable)

- **`TraceSchemaVersion`** (`"0.1"`)
- **`TraceEvent`** union and specific event types:
  - `RunStartedEvent` (`event: "run_started"`)
  - `RunCompletedEvent` (`event: "run_completed"`)
  - `StepStartedEvent` (`event: "step_started"`)
  - `StepCompletedEvent` (`event: "step_completed"`)
- Related types: `StepType`, `StepStatus`, `RunStatus`, `ErrorInfo`, `StepMetadata`, `TokenMetadata`

### Log-derived normalized model (stable as a model, not necessarily the parsing APIs)

- **`InspectKind`**
- **`AttributionConfidence`**
- **`InspectEvent`**, **`InspectNode`**, **`InspectRunTree`**
- **`EventSource`**

### Log ingest config types (stable)

- **`LogIngestConfig`**
- **`LogEventMapping`**
- **`RedactionRule`**, **`RedactionStrategy`**

## 5. Experimental log parsing APIs

Advanced ingestion: use this when your app already emits structured logs. These are compatibility-oriented utilities for turning structured logs into normalized `InspectEvent` and grouped trees. They remain conservative: **no eval**, **no parsing JS object literals**, JSON logs first-class, log4js best-effort.

- **`parseLogsToTrees`**
- **`JsonLogParser`**, **`Log4jsParser`**
- **`EventNormalizer`**
- **`TreeBuilder`**
- **`Redactor`**
- **`renderRunTree`**, **`renderRunTrees`**
- **`parseLogLine`**

## 6. Experimental live tail APIs

The CLI `tail` workflow is supported. The programmatic accumulator is experimental.

- **`LiveLogAccumulator`**

## 7. Experimental standards export APIs

Exports are **read-only**, **local-only**, and **compatibility-oriented**. They do not upload, stream, or integrate vendor SDKs.

- **`exportRunTree`**, **`redactRunTreeForExport`**
- **`ExportOptions.redactionProfile`**: `local` (default), `share`, or `strict` — applies key-based redaction to an exported copy without mutating the source tree.
- **`exportMarkdown`**, **`exportHtml`**
- **`exportOpenInference`** (OpenInference-compatible JSON)
- **`exportOtlpJson`** (OTLP JSON, experimental until verified per backend)
- **`validateExport`**, `validateExportContent` (validation helpers)

## 8. Experimental diff APIs

Diff is local and read-only. Programmatic diff surfaces are experimental until the comparison semantics are explicitly frozen.

- **`diffRuns`**
- **`diffTraceEvents`**
- **`renderRunDiff`**
- **`manualTraceEventsToComparableRun`**

## 9. Experimental `@agent-inspect/langchain` APIs

`@agent-inspect/langchain` is an optional adapter package.

- **`AgentInspectCallback`** (experimental)
  - **`persist`**: default `false` — when `true`, maps callback lifecycle to schemaVersion `"0.1"` JSONL (`run_started` / `step_started` / `step_completed` / `run_completed`)
  - **`runName`**: default `"langchain-agent"` for standalone persisted runs
  - **`traceDir`**: defaults via `resolveTraceDir` / `AGENT_INSPECT_TRACE_DIR`
  - **`capture`**: `"none"` | `"metadata-only"` (default) | `"preview"` (truncated previews, opt-in)
  - **`stream`**: default `false` — when `true`, records streaming lifecycle metadata (`chunkCount`, `streamDurationMs`, etc.) on LLM end/error; does **not** capture full token text by default
  - **`maxStreamPreviewChars`**: bounds `streamPreview` when `capture: "preview"` and `stream: true` (defaults to `maxPreviewChars`)
  - **`redact`**: custom `RedactionRule[]` applied before disk (core defaults still apply via shared redactor)
  - **`runId`**: optional id for standalone persisted runs
  - In-memory **`getEvents()`** / **`clear()`** unchanged when `persist` is false
- Metadata helpers: `extractModelName`, `extractTokenUsage`, `safePreview`, `toPlainMetadata`

Rationale: v1.x includes one official adapter and **zero production sinks**, so adapter surfaces remain experimental.

## 10. Experimental `@agent-inspect/tui` APIs

`@agent-inspect/tui` is an optional package. CLI integration via `agent-inspect view --tui` is supported; programmatic TUI APIs remain experimental.

- `runTraceViewer`, `loadTraceForTui`, `buildTuiTraceModel`, etc.

## 11. Experimental `@agent-inspect/ai-sdk` APIs

`@agent-inspect/ai-sdk` is an optional adapter package for Vercel AI SDK v6 telemetry integrations. It is experimental and published as part of the aligned v1.8.0 package set.

Import from `@agent-inspect/ai-sdk`:

```ts
import { agentInspect } from "@agent-inspect/ai-sdk";
```

- **`agentInspect(options?)`**: returns an AI SDK `TelemetryIntegration` bound with `bindTelemetryIntegration()`.
  - **`writer`**: optional explicit local `TraceWriter` for tests, recipes, and controlled runtime integration.
  - **`traceDir`**: optional local directory that creates a file writer inside the adapter package.
  - **`runName`**: optional local run name.
  - **`capture`**: `"metadata-only"` (default) or `"preview"`; `preview` currently emits a diagnostic and falls back to metadata-only.
  - **`redactionProfile`** and **`maxPreviewChars`**: preview-only knobs; when preview capture is unsupported or not selected, they emit diagnostics instead of silently doing nothing.
  - **`getDiagnostics()`**: exposes isolated adapter write, lifecycle/configuration, flush, and close failures without throwing into AI SDK callbacks.
  - **`getWriterStats()`**, **`flush()`**, and **`close()`**: explicit writer lifecycle helpers. Failures are captured in diagnostics.

Every AI SDK call using the adapter must keep telemetry local and metadata-only:

```ts
experimental_telemetry: {
  isEnabled: true,
  recordInputs: false,
  recordOutputs: false,
  integrations: [agentInspect({ traceDir: "./.agent-inspect" })],
}
```

The adapter records local v0.2 persisted events for run, LLM step, and tool lifecycle metadata. It does not persist raw prompts, messages, generated text, stream chunks, tool inputs, tool outputs, headers, request bodies, response bodies, or user `experimental_context`. Unsupported preview capture options are explicit diagnostics and keep this metadata-only behavior.

No network writer, OpenTelemetry exporter, provider wrapper, or global monkey-patch is part of this package.

Recipe: [examples/recipes/ai-sdk-local-telemetry](../examples/recipes/ai-sdk-local-telemetry/).

## 12. Experimental `@agent-inspect/vitest` APIs

`@agent-inspect/vitest` is an optional experimental workspace package for local Vitest failure artifacts. It remains private/unpublished. It does not add a Vitest dependency to root/core, does not upload artifacts, and does not infer trace relationships by timestamp.

Import from `@agent-inspect/vitest`:

```ts
import { createAgentInspectVitestReporter } from "@agent-inspect/vitest";
```

- **`createAgentInspectVitestReporter(options?)`**: returns a structural Vitest reporter facade with `onTestCaseResult`, `onTaskUpdate`, and `onFinished` hooks.
  - **`artifactDir`**: local output directory for safe artifacts; defaults to `.agent-inspect/vitest-artifacts`.
  - **`githubSummary`**: optional GitHub step-summary file path. The reporter appends bounded structural counts only and does not use the GitHub API.
  - **`retainSuccessful`**: `false`/undefined keeps no passing-test artifacts; `true` keeps up to `maxSuccessfulTraces`; a number keeps up to that many passing-test artifacts.
  - **`maxSuccessfulTraces`**: upper bound for passing-test artifacts, capped by the reporter.
  - **`resolveTrace(test)`**: optional explicit association resolver when task metadata is not convenient.
  - **`onDiagnostic(diagnostic)`**: observes non-fatal reporter/artifact failures.
  - **`getDiagnostics()`** and **`getArtifacts()`** expose reporter state for tests and custom harnesses.
- **`agentInspectVitestReporter`**: alias for `createAgentInspectVitestReporter`.

Trace association must be explicit. The default resolver reads `meta.agentInspect`, `meta["agent-inspect"]`, `meta.trace`, `context.meta.agentInspect`, or result metadata when present:

```ts
ctx.task.meta.agentInspect = {
  runId: "support-agent",
  tracePath: ".agent-inspect/support-agent.jsonl",
  artifactLabel: "support-agent",
};
```

Artifacts are safe structural summaries. They include bounded test identity, status, trace run id, and trace filename, but they do not read or embed raw trace contents, prompts, generated outputs, request/response bodies, headers, API keys, secrets, or tool payloads. Reporter/artifact failures are diagnostics and do not replace original Vitest failures.

## 13. Experimental `@agent-inspect/jest` APIs

`@agent-inspect/jest` is an optional experimental workspace package for local Jest failure artifacts. It remains private/unpublished. It does not add a Jest dependency to root/core, does not upload artifacts, and does not infer trace relationships by timestamp.

Import from `@agent-inspect/jest`:

```ts
import { AgentInspectJestReporter, createAgentInspectJestReporter } from "@agent-inspect/jest";
```

- **`AgentInspectJestReporter`**: default Jest custom reporter class for `reporters: [["@agent-inspect/jest", options]]`.
- **`createAgentInspectJestReporter(options?)`**: returns a structural reporter facade with `onTestResult` and `onRunComplete` hooks for tests and custom harnesses.
  - **`artifactDir`**: local output directory for safe artifacts; defaults to `.agent-inspect/jest-artifacts`.
  - **`githubSummary`**: optional GitHub step-summary file path. The reporter appends bounded structural counts only and does not use the GitHub API.
  - **`retainSuccessful`**: `false`/undefined keeps no passing-test artifacts; `true` keeps up to `maxSuccessfulTraces`; a number keeps up to that many passing-test artifacts.
  - **`maxSuccessfulTraces`**: upper bound for passing-test artifacts, capped by the reporter.
  - **`associations`**: explicit trace associations keyed by `file::fullName`, `basename::fullName`, or `fullName`.
  - **`resolveTrace(test)`**: optional explicit association resolver for normalized Jest assertion results.
  - **`onDiagnostic(diagnostic)`**: observes non-fatal reporter/artifact failures.
  - **`getDiagnostics()`** and **`getArtifacts()`** expose reporter state for tests and custom harnesses.
- **`agentInspectJestReporter`**: alias for `createAgentInspectJestReporter`.

Jest association is explicit because Jest assertion results do not expose Vitest-style mutable task metadata:

```js
reporters: [
  [
    "@agent-inspect/jest",
    {
      associations: {
        "agent.test.cjs::agent suite agent workflow": {
          runId: "support-agent",
          tracePath: ".agent-inspect/support-agent.jsonl",
        },
      },
    },
  ],
],
```

Artifacts are safe structural summaries. They include bounded test identity, status, trace run id, and trace filename, but they do not read or embed raw trace contents, prompts, generated outputs, request/response bodies, headers, API keys, secrets, or tool payloads. Reporter/artifact failures are diagnostics and do not replace original Jest failures.

## 14. Experimental `@agent-inspect/openai-agents` APIs

`@agent-inspect/openai-agents` is an optional experimental package for OpenAI Agents JS tracing processor integration. It is public in the aligned v1.8.0 package set and records runtime metadata locally.

Import from `@agent-inspect/openai-agents`:

```ts
import { agentInspectProcessor } from "@agent-inspect/openai-agents";
```

- **`agentInspectProcessor(options?)`**: returns a local-only OpenAI Agents `TracingProcessor`.
  - **`installMode`**: always `"setTraceProcessors"` to document the safe replacement install path.
  - **`localOnly`**: always `true`; the processor performs no network I/O and does not install itself globally.
  - **`writer`**: optional explicit local `TraceWriter` for tests, recipes, and controlled runtime integration.
  - **`traceDir`**: optional local directory that creates a file writer inside the adapter package.
  - **`workflowName`**: optional local run name overriding the SDK trace name.
  - **`capture`**: `"metadata-only"` (default) or `"preview"`; `preview` currently emits a diagnostic and falls back to metadata-only.
  - **`redactionProfile`** and **`maxPreviewChars`**: preview-only knobs; when preview capture is unsupported or not selected, they emit diagnostics instead of silently doing nothing.
  - **`getDiagnostics()`**: exposes isolated processor write, lifecycle/configuration, flush, and shutdown failures without throwing into OpenAI Agents callbacks.
  - **`getWriterStats()`**, **`forceFlush()`**, and **`shutdown()`**: explicit writer lifecycle helpers. Failures are captured in diagnostics.

Safe future usage must replace processors explicitly:

```ts
setTraceProcessors([agentInspectProcessor({ traceDir: "./.agent-inspect" })]);
```

Do not use `addTraceProcessor()` as the default AgentInspect path; that leaves existing/default processors in place and can preserve backend export behavior in server runtimes.

The processor records local v0.2 persisted events for trace/run, agent, generation/response, function/tool, handoff, guardrail, MCP tools, custom, transcription, and speech span metadata where safely representable. It does not persist raw prompts, messages, generated text, function inputs/outputs, arbitrary custom data, trace exporter credentials, headers, request bodies, response bodies, or hosted tool payloads by default.

## 15. Experimental persisted-event foundation (v1.2.0)

These helpers expose the **source-agnostic `PersistedInspectEvent` model** (`schemaVersion: "0.2"`). They are **local-only**, **in-memory**, and **do not change** storage write/read or CLI behavior in v1.2.0.

Import from `agent-inspect/persisted`:

| API | Role |
| --- | ---- |
| `isPersistedInspectEvent` | Runtime validator for v0.2 persisted events |
| `traceEventToPersistedInspectEvent` | Convert one v0.1 `TraceEvent` |
| `traceEventsToPersistedInspectEvents` | Batch v0.1 → v0.2 |
| `inspectEventToPersistedInspectEvent` | Convert one in-memory `InspectEvent` |
| `inspectEventsToPersistedInspectEvents` | Batch `InspectEvent` → v0.2 |
| `persistedInspectEventToInspectEvent` | Convert one v0.2 event to `InspectEvent` |
| `persistedInspectEventsToInspectEvents` | Batch v0.2 → `InspectEvent` |
| `persistedInspectEventsToRunTrees` | Build `InspectRunTree[]` from v0.2 events (via `TreeBuilder`) |
| `traceEventsToPersistedRunTrees` | v0.1 `TraceEvent[]` → persisted model → trees |

Related types: `PersistedInspectEvent`, `PersistedEventSourceType`, `PersistedEventStatus`, `TraceEventToPersistedOptions`, `InspectEventToPersistedOptions`, `PersistedToInspectEventOptions`, `PersistedTreeBridgeOptions`.

**Notes:**

- Manual trace **writing** remains `schemaVersion: "0.1"`.
- v0.2 is **not written by default**; use converters and `fixtures/traces-v0.2/` samples for validation.
- Inspection read paths normalize v0.1 and v0.2 JSONL for local CLI/API use. v0.2 remains experimental as a persisted-event foundation and is not the default writer.

## 16. Local observability helpers (v1.4.0+)

Read-only helpers for timeline, stats, and search over local JSONL traces. v0.1 manual traces remain the default writer; v0.2 persisted-event files are accepted where the shared dual-format read path is used. Local files only.

- **`buildRunTimeline`**, **`renderTimeline`** — chronological run view; types `RunTimeline`, `TimelineEntry`
- **`buildTraceStats`**, **`renderTraceStats`** — directory aggregates; type `TraceStats`
- **`searchTraces`**, **`parseDurationFilter`**, **`loadTraceMetadataList`** — deterministic search; types `TraceSearchResult`, `TraceSearchOptions`

CLI wrappers: `agent-inspect timeline`, `stats`, `search` — see [CLI.md](./CLI.md).

## 17. Report and what helpers (v1.5.0+)

Read-only helpers for concise inspection summaries and local reports:

- **`buildRunWhatSummary`**, **`renderRunWhat`** — summarize status, duration, step counts, correlation metadata, slowest step, errors, and supplied token usage.
- **`buildRunReport`** — render Markdown or HTML reports from local trace events.

Report redaction profiles are key-based safeguards applied to the complete rendered report input, not only to the tree section. Review generated reports before sharing; this is not compliance-grade DLP.

## 18. Experimental trace writers (v1.6)

Trace writers are the first slice of the v1.6 runtime foundation. They are experimental during v1.x and intended for tests, adapters, and future `createInspector` work.

Import from `agent-inspect/writers`:

```ts
import {
  bufferedFileWriter,
  compositeWriter,
  fileWriter,
  memoryWriter,
  nullWriter,
} from "agent-inspect/writers";
import type {
  BufferedFileWriterOptions,
  CompositeTraceWriterOptions,
  FileTraceWriterOptions,
  TraceWriter,
  TraceWriterStats,
} from "agent-inspect/writers";
```

- **`TraceWriter`**: async `write(event)`, optional `flush()`, optional `close()`, optional `getStats()`.
- **`fileWriter({ dir?, filePath? })`**: appends v0.2 `PersistedInspectEvent` JSONL rows to local disk. By default it derives one file per `event.runId`; `filePath` writes all events to an explicit local file. Filesystem and serialization failures are reflected in writer stats instead of being thrown into application code.
- **`bufferedFileWriter({ dir?, filePath?, maxQueueSize?, flushIntervalMs?, maxBatchSize?, overflow? })`**: buffers local JSONL writes with bounded queue behavior. Overflow supports `drop-oldest` and `drop-newest`; neither mode throws into application code.
- **`compositeWriter([...writers])`**: fans out events to multiple explicit local/custom writers. A failing child writer does not prevent other children from receiving events; failures are reflected in composite stats.
- **`memoryWriter()`**: stores cloned `PersistedInspectEvent` rows in memory for tests, adapter fixtures, and eval harnesses.
- **`nullWriter()`**: accepts events without retaining them for disabled mode, overhead comparisons, and no-output tests.

No network writer or vendor sink exists in this package.

## 19. Experimental inspector API/runtime (v1.6)

`createInspector()` is the experimental public instance API for local-first tracing with explicit writers. It owns an instance-specific runtime context, records v0.2 persisted inspect events, preserves application return values/errors, and exposes diagnostics plus deterministic `flush()`/`close()` lifecycle hooks.

Import from `agent-inspect/advanced`:

```ts
import { createInspector } from "agent-inspect/advanced";
import { memoryWriter } from "agent-inspect/writers";

const writer = memoryWriter();
const inspector = createInspector({
  writer,
  capture: { onSuccess: "metadata-only", onError: "metadata-only" },
});

await inspector.run("support-agent", async () => {
  await inspector.step("plan", async () => "ok");
  await inspector.tool("retrieve-policy", async () => "policy");
  return inspector.llm("fixture-model", async () => "done");
});

await inspector.flush();
```

Public methods:

- **`run(name, fn, options?)`**: starts an isolated run context and writes run lifecycle events.
- **`step(name, fn, options?)`**: writes nested step lifecycle events when called inside the same inspector's run context; outside a context it passes through.
- **`tool(name, fn, options?)`** / **`llm(name, fn, options?)`**: convenience wrappers that set `type` and metadata.
- **`observe(name, fn, options?)`**: returns an async wrapper that records the function call as an inspector step.
- **`getDiagnostics()`**: returns instrumentation error counts and writer stats without requiring direct runtime access.
- **`flush()`** / **`close()`**: delegate to the configured writer through the runtime.

`capture` is explicit and metadata-only. `onSuccess: "metadata-only"` records safe type/length/key-count summaries in `outputSummary`; `onError: "metadata-only"` records thrown-value type/name summaries. It does not store raw return values, prompts, outputs, or thrown objects. Use `"none"` to disable a capture side.

`traceDir` and `silent` on `createInspector()` are context metadata for compatibility with existing helpers. They do not configure persistence or terminal output. Prefer writer-owned output configuration such as `fileWriter({ dir })` or `fileWriter({ filePath })`.

`createInspectorRuntime()` is also available from `agent-inspect/advanced` as the low-level isolation primitive. Most users should prefer `createInspector()` and `inspector.getDiagnostics()`. Root exports for the runtime remain available for 1.x compatibility, but new advanced usage should import from `agent-inspect/advanced`.

These APIs are experimental during v1.x. They do not add a default network writer or vendor sink.

## 20. Experimental trace readers (v1.6)

`agent-inspect/readers` exposes the experimental local trace reader contract and detection pipeline. It includes AgentInspect JSONL for v0.1, v0.2, and mixed local trace files, plus local OpenInference JSON and OTLP JSON compatibility readers.

Import from `agent-inspect/readers`:

```ts
import {
  DEFAULT_TRACE_READERS,
  agentInspectJsonlReader,
  detectTraceFormat,
  openInferenceJsonReader,
  openTrace,
  otlpJsonReader,
  readTrace,
} from "agent-inspect/readers";
import type { TraceReader } from "agent-inspect/readers";
```

- **`TraceInput`**: file, directory, string, buffer, or stdin input descriptor.
- **`TraceReader`**: experimental reader interface with `format`, `detect(input)`, and `read(input)`.
- **`detectTraceFormat(input, { readers?, format? })`**: deterministic, conservative format detection. Explicit `format` acts as an override only when a matching reader is registered.
- **`readTrace(input, { readers?, format? })`**: detects a reader and returns `TraceReadResult`; unsupported or ambiguous input throws `TraceReadError`.
- **`openTrace(input, options?)`**: alias for `readTrace()` and the API path used by the universal `agent-inspect open` command.
- **`agentInspectJsonlReader`**: built-in local AgentInspect JSONL reader for v0.1, v0.2, and mixed files/directories.
- **`openInferenceJsonReader`**: local OpenInference JSON compatibility reader. Prompt/output-like attributes are summarized and bounded rather than stored as raw content.
- **`otlpJsonReader`**: local OTLP/HTTP JSON trace payload reader. Resource, scope, span, status, event, and parent metadata are preserved where possible with warnings for unsupported fields.
- **`DEFAULT_TRACE_READERS`**: ordered built-in reader registry used when no custom `readers` array is supplied.

The reader contract does not silently accept arbitrary JSON and does not add OTel SDK, database, hosted ingestion, or network upload dependencies.

## 21. Experimental Checks

`agent-inspect/checks` exposes the experimental deterministic trace-check engine foundation. It consumes normalized reader output, runs supplied pure rules in stable order, and returns aggregate findings/diagnostics. It does not read files, discover config, call providers, perform network I/O, mutate inputs, or create a new persisted schema.

Import from `agent-inspect/checks`:

```ts
import { runTraceChecks } from "agent-inspect/checks";
import type { TraceCheckRule, TraceCheckResult } from "agent-inspect/checks";
```

- **`runTraceChecks({ read }, { rules?, select?, runId? })`**: executes provided rules against a `TraceReadResult` from `agent-inspect/readers`.
- **Built-in rule factories**: run, tool, LLM, structure, retrieval, guardrail, decision, safety, and baseline helpers including `createRunStatusRule`, `createToolUsageRule`, `createLlmUsageRule`, `createStructureOrphanRule`, `createStructureCycleRule`, `createStructureRelationshipRule`, `createRetrievalRule`, `createGuardrailRule`, `createDecisionRule`, `createSafetyRawContentRule`, `createSafetySecretPatternRule`, and `createBaselineRegressionRule`.
- **`TraceCheckRule`**: synchronous pure rule contract.
- **`TraceCheckResult`**: deterministic aggregate result with findings, evidence, summary counts, and execution diagnostics.

The checks API is experimental in v1.x. The `agent-inspect check` CLI uses this API for local reader-backed checks and deterministic JSON output; `agent-inspect artifacts` reuses the same safe findings for local CI artifact bundles and optional step-summary file output. Built-in rules operate on normalized event metadata, tree relationships, bounded summaries, token counts, and normalized baseline facts; safety and baseline findings identify event IDs and field paths rather than emitting raw prompts, outputs, secrets, headers, request/response bodies, or full tool payloads.

Recipes: [deterministic-ci-checks](../examples/recipes/deterministic-ci-checks/README.md) for check/baseline/artifact workflows, and [test-reporter-artifacts](../examples/recipes/test-reporter-artifacts/README.md) for Vitest/Jest reporter configuration patterns.

## 22. Deprecated APIs

No deprecated APIs are declared as of 1.4.0.

## 23. Removal / deprecation policy

- Stable APIs are not removed in v1.x.
- If removal is necessary, the API should be **deprecated** first, documented, and kept for a reasonable window (target: at least one minor line) unless security requires faster action.

## 24. Backward compatibility policy

- Manual trace JSONL (`schemaVersion: "0.1"`) remains readable.
- Additive schema changes are allowed in minor versions.
- Breaking changes require a major version.
- Unknown fields should be ignored where safe.

## 25. Examples

### Minimal manual trace

```ts
import { inspectRun, step } from "agent-inspect";

await inspectRun("demo-agent", async () => {
  const plan = await step("plan", async () => "ok");
  const hits = await step.tool("search", async () => ({ count: 2 }));
  const answer = await step.llm("fixture-model", async () => "done");
  return { plan, hits, answer };
});
```
