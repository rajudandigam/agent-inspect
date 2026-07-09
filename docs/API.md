# API

This document describes the **public TypeScript API surface** of AgentInspect and classifies each area as **stable** or **experimental**.

AgentInspect is a **local-first execution-tree debugger**. It is not a SaaS, not a production APM, not a sink/uploader, and not a replay engine.

## 1. Stability policy

- **Stable**: intended to stay compatible within the current major version.
- **Experimental**: available for adoption, but subject to refinement (including naming/shape changes) before a future stability declaration.

Use the root import for stable beginner APIs. Use subpaths for advanced, experimental, or lower-level workflows.

```ts
import {
  createInspector,
  observe,
  inspectRun,
  maybeInspectRun,
  step,
  getCurrentCorrelationMetadata,
} from "agent-inspect";
```

**v2 root API contract:** do not add new root exports casually. Advanced, experimental, and lower-level helpers belong on the subpath where the API lives. The stable root value set is:

```ts
import {
  createInspector,
  observe,
  inspectRun,
  maybeInspectRun,
  step,
  getCurrentCorrelationMetadata,
} from "agent-inspect";
```

**Subpath exports:** Subpaths (`/logs`, `/exporters`, `/persisted`, `/diff`, `/advanced`, `/writers`, `/readers`, `/checks`) narrow the import surface for experimental and advanced APIs. Design history: [API-BOUNDARY-V1.5.md](./implementation/API-BOUNDARY-V1.5.md).

```ts
import { parseLogsToTrees } from "agent-inspect/logs";
import { exportMarkdown } from "agent-inspect/exporters";
import { memoryWriter } from "agent-inspect/writers";
import { openTrace } from "agent-inspect/readers";
import { runTraceChecks } from "agent-inspect/checks";
import { diffTraceEvents } from "agent-inspect/diff";
import { traceEventsToPersistedInspectEvents } from "agent-inspect/persisted";
import { createInspectorRuntime } from "agent-inspect/advanced";
```

Notes:

- The core guarantee is **stable local debugging**: manual tracing + CLI inspection.
- Export formats (OpenInference / OTLP JSON) are **local-only** and **compatibility-oriented**. They do **not** upload anywhere.
- There are **zero production sinks**; sink/uploader APIs are not stable.
- Advanced APIs are available from `agent-inspect/advanced`, `agent-inspect/readers`, `agent-inspect/writers`, `agent-inspect/checks`, `agent-inspect/diff`, `agent-inspect/exporters`, `agent-inspect/logs`, and `agent-inspect/persisted`.

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
- **`isAgentInspectEnabled(value?)`**: advanced helper available from `agent-inspect/advanced`; returns whether a string (or `process.env.AGENT_INSPECT`) matches an enable token.
- **`step(name, fn, options?)`**: traces a named unit of work inside `inspectRun` (`step_started` / `step_completed`). Step `metadata` inherits the parent run's redaction and size-bound settings.
  - **`step.llm(model, fn)`**: convenience wrapper (`type: "llm"`, `metadata.model`).
  - **`step.tool(toolName, fn)`**: convenience wrapper (`type: "tool"`, `metadata.toolName`).
- **`observe(agent, options?)`**: proxy wrapper that traces top-level `run` / `execute` / `invoke` methods via `inspectRun`.
- **`observeOutcome(name, options)`** (v4.4.0+): records an observed outcome (`outcome_observed`) inside an active `inspectRun` context. Requires `expectation` and `status` (`passed` | `failed` | `unknown` | `skipped`); optional `method`, `actual`, and `evidence`. Outside a run → warn and no-op (never throws). `actual` / `evidence` are bounded and redacted before disk.
- **`getCurrentCorrelationMetadata()`**: returns active run correlation fields (`correlationId`, `requestId`, `decisionId`, `groupId`) inside `inspectRun` / `maybeInspectRun`; `undefined` outside a traced run or when none were set.
- **`RedactionProfile`**: `"local" | "share" | "strict"` — see `redactionProfile` on `InspectRunOptions` and `ExportOptions`.
- **`resolveRedactionProfile(profile?)`**: advanced helper available from `agent-inspect/advanced`; resolves profile extra keys and metadata caps for integrations.

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
  - `OutcomeObservedEvent` (`event: "outcome_observed"`, v4.4.0+)
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

## 11.1 Experimental `agent-inspect/reporters` APIs

`agent-inspect/reporters` contains shared, dependency-free helpers for local test reporter artifacts. The subpath does not import Vitest, Jest, GitHub SDKs, provider SDKs, or upload clients.

Import from `agent-inspect/reporters`:

```ts
import {
  TRACE_ARTIFACT_MANIFEST_SCHEMA_VERSION,
  createReporterArtifactPath,
  createTraceArtifactManifest,
  validateReporterArtifactPath,
  type TraceArtifactManifest,
} from "agent-inspect/reporters";
```

- **`TRACE_ARTIFACT_MANIFEST_SCHEMA_VERSION`**: currently `"0.1"` for local reporter manifests.
- **`createTraceArtifactManifest(options)`**: clones, sorts, and deduplicates reporter results/artifacts into deterministic manifest JSON.
- **`createReporterArtifactPath(options)`**: creates a safe relative artifact path under a caller-provided output directory.
- **`validateReporterArtifactPath(options)`**: rejects empty, absolute, traversal, Windows-absolute, and symlink-escape style paths before reporters or `ci-summary` trust artifact links.

The manifest records framework, generation time, bounded test results, artifact descriptors, redaction profile, and diagnostics. It is an artifact index only; it should not contain raw trace contents, prompts, model outputs, request/response bodies, headers, API keys, secrets, or full tool payloads.

## 12. Experimental `@agent-inspect/vitest` APIs

`@agent-inspect/vitest` is an optional experimental workspace package for local Vitest failure artifacts. It remains private/unpublished pending maintainer first-publication setup. It does not add a Vitest dependency to root/core, does not upload artifacts, and does not infer trace relationships by timestamp.

Import from `@agent-inspect/vitest`:

```ts
import { createAgentInspectVitestReporter } from "@agent-inspect/vitest";
```

- **`createAgentInspectVitestReporter(options?)`**: returns a structural Vitest reporter facade with `onTestCaseResult`, `onTaskUpdate`, and `onFinished` hooks.
  - **`artifactDir`**: local output directory for safe artifacts; defaults to `.agent-inspect/vitest-artifacts`.
  - **`githubSummary`**: optional GitHub step-summary file path. The reporter appends bounded structural counts only and does not use the GitHub API.
  - **`retainSuccessful`**: `false`/undefined keeps no passing-test artifacts; `true` keeps up to `maxSuccessfulTraces`; a number keeps up to that many passing-test artifacts.
  - **`maxSuccessfulTraces`**: upper bound for passing-test artifacts, capped by the reporter.
  - **`redactionProfile`**: manifest artifact profile, `local` (default), `share`, or `strict`.
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

Artifacts are safe structural summaries. The reporter writes a shared `schemaVersion: "0.1"` manifest wrapper with package metadata, generated time, framework, test results, artifact descriptors, relative paths, and redaction profile. It includes bounded test identity, status, trace run id, and trace filename, but it does not read or embed raw trace contents, prompts, generated outputs, request/response bodies, headers, API keys, secrets, or tool payloads. Reporter/artifact failures are diagnostics and do not replace original Vitest failures.

## 13. Experimental `@agent-inspect/jest` APIs

`@agent-inspect/jest` is an optional experimental workspace package for local Jest failure artifacts. It remains private/unpublished pending maintainer first-publication setup. It does not add a Jest dependency to root/core, does not upload artifacts, and does not infer trace relationships by timestamp.

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
  - **`redactionProfile`**: manifest artifact profile, `local` (default), `share`, or `strict`.
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

Artifacts are safe structural summaries. The reporter writes a shared `schemaVersion: "0.1"` manifest wrapper with package metadata, generated time, framework, test results, artifact descriptors, relative paths, and redaction profile. It includes bounded test identity, status, trace run id, and trace filename, but it does not read or embed raw trace contents, prompts, generated outputs, request/response bodies, headers, API keys, secrets, or tool payloads. Reporter/artifact failures are diagnostics and do not replace original Jest failures.

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

These helpers expose the **source-agnostic `PersistedInspectEvent` model**. They are **local-only** and support v0.2 compatibility plus the stable schema 1.0 persisted contract.

Import from `agent-inspect/persisted`:

| API | Role |
| --- | ---- |
| `isPersistedInspectEvent` | Runtime validator for supported persisted events |
| `traceEventToPersistedInspectEvent` | Convert one v0.1 `TraceEvent` |
| `traceEventsToPersistedInspectEvents` | Batch v0.1 → v0.2 |
| `inspectEventToPersistedInspectEvent` | Convert one in-memory `InspectEvent` |
| `inspectEventsToPersistedInspectEvents` | Batch `InspectEvent` → persisted events |
| `persistedInspectEventToInspectEvent` | Convert one persisted event to `InspectEvent` |
| `persistedInspectEventsToInspectEvents` | Batch persisted events → `InspectEvent` |
| `persistedInspectEventsToRunTrees` | Build `InspectRunTree[]` from persisted events (via `TreeBuilder`) |
| `traceEventsToPersistedRunTrees` | v0.1 `TraceEvent[]` → persisted model → trees |

Related types: `PersistedInspectEvent`, `PersistedEventSourceType`, `PersistedEventStatus`, `TraceEventToPersistedOptions`, `InspectEventToPersistedOptions`, `PersistedToInspectEventOptions`, `PersistedTreeBridgeOptions`.

**Notes:**

- Manual global trace **writing** remains `schemaVersion: "0.1"`.
- `createInspector()` and built-in persisted writer paths target schema 1.0 rows.
- Inspection read paths normalize v0.1, v0.2, and v1.0 JSONL for local CLI/API use. v0.2 remains a compatibility foundation.

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

Trace writers are the local persistence contract for tests, adapters, and `createInspector()` workflows.

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
- **`fileWriter({ dir?, filePath? })`**: appends `PersistedInspectEvent` JSONL rows to local disk. `createInspector()` emits schema 1.0 rows by default; compatibility adapters may still pass readable v0.2 rows. By default it derives one file per `event.runId`; `filePath` writes all events to an explicit local file. Filesystem and serialization failures are reflected in writer stats instead of being thrown into application code.
- **`bufferedFileWriter({ dir?, filePath?, maxQueueSize?, flushIntervalMs?, maxBatchSize?, overflow? })`**: buffers local JSONL writes with bounded queue behavior. Overflow supports `drop-oldest` and `drop-newest`; neither mode throws into application code.
- **`compositeWriter([...writers])`**: fans out events to multiple explicit local/custom writers. A failing child writer does not prevent other children from receiving events; failures are reflected in composite stats.
- **`memoryWriter()`**: stores cloned `PersistedInspectEvent` rows in memory for tests, adapter fixtures, and eval harnesses.
- **`nullWriter()`**: accepts events without retaining them for disabled mode, overhead comparisons, and no-output tests.

No network writer or vendor sink exists in this package.

## 19. Experimental inspector API/runtime (v1.6)

`createInspector()` is the public instance API for local-first tracing with explicit writers. It owns an instance-specific runtime context, records schema 1.0 persisted inspect events, preserves application return values/errors, and exposes diagnostics plus deterministic `flush()`/`close()` lifecycle hooks.

Import from `agent-inspect`:

```ts
import { createInspector } from "agent-inspect";
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
- **`observeOutcome(name, options)`** (v4.4.0+): writes `outcome_observed` / `OUTCOME` events through the configured writer when inside an inspector run context.
- **`getDiagnostics()`**: returns instrumentation error counts and writer stats without requiring direct runtime access.
- **`flush()`** / **`close()`**: delegate to the configured writer through the runtime.

`capture` is explicit and metadata-only. `onSuccess: "metadata-only"` records safe type/length/key-count summaries in `outputSummary`; `onError: "metadata-only"` records thrown-value type/name summaries. It does not store raw return values, prompts, outputs, or thrown objects. Use `"none"` to disable a capture side.

`traceDir` and `silent` on `createInspector()` are context metadata for compatibility with existing helpers. They do not configure persistence or terminal output. Prefer writer-owned output configuration such as `fileWriter({ dir })` or `fileWriter({ filePath })`.

`createInspectorRuntime()` is available from `agent-inspect/advanced` as the low-level isolation primitive. Most users should prefer `createInspector()` and `inspector.getDiagnostics()`.

The low-level runtime helpers remain on `agent-inspect/advanced`. These APIs do not add a default network writer or vendor sink.

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

## 22. Experimental `@agent-inspect/eval` APIs (v2.1)

`@agent-inspect/eval` is an optional package for deterministic local evals over existing traces. It consumes normalized reader output or local trace paths, returns stable JSON-compatible results, and does not call model providers, upload traces, replay agents, or create hosted datasets.

Import from `@agent-inspect/eval`:

```ts
import { checks, evalRun, renderEvalMarkdown } from "@agent-inspect/eval";
```

- **`evalRun(input, options?)`**: runs selected eval rules over a local trace path or `TraceReadResult`.
- **`checks`**: built-in deterministic rule factories for run status, tool usage, duration, depth, retries, token totals, failed steps, retrieval-before-generation, decision metadata, context overlap, quote overlap, citation presence, required source IDs, answer length bounds, and banned unsupported phrases.
- **`renderEvalMarkdown(result)`**: renders a deterministic Markdown summary suitable for local CI logs, PR text, or artifact files after review.
- Result types include **`EvalRunResult`**, **`EvalFinding`**, **`EvalDiagnostic`**, and **`EvalRule`**.

Findings are designed for CI output: they include rule IDs, expected/actual structural summaries, and evidence paths. They should not include raw prompt, answer, context, request/response, header, API key, secret, or full tool payload values.

CLI wrapper: `agent-inspect eval <trace-path-or-run-id> --require-success --json`.

Recipes: [eval-local-checks](../examples/recipes/eval-local-checks/README.md) and [eval-ci-artifacts](../examples/recipes/eval-ci-artifacts/README.md).

## 23. Experimental `@agent-inspect/redact` APIs (v2.1)

`@agent-inspect/redact` is an optional package for reusable local redaction. It powers the root CLI `redact` workflow and shared trace-safety integrations. Redaction operates on local values/files and returns a redacted copy; it does not mutate the source object, upload content, or claim compliance-grade DLP.

Import from `@agent-inspect/redact`:

```ts
import { createRedactor, redact } from "@agent-inspect/redact";
```

- **`redact(value, options?)`**: returns `{ value, findings, redacted, profile }` for a redacted copy.
- **`createRedactor(options?)`**: creates a reusable redactor with profile, custom detectors, and custom rules.
- **Profiles**: `local`, `share`, and `strict`.
- **Findings**: detector id, path, action, severity, and bounded preview metadata where applicable.

CLI wrapper: `agent-inspect redact <trace-or-file> --profile share --json`.

Recipe: [redact-share-safe-file](../examples/recipes/redact-share-safe-file/README.md).

## 24. Experimental local explain APIs (v1.9)

`buildLocalExplanation()` creates a deterministic local explanation payload from a reader-selected `InspectRunTree`. It performs no network I/O, does not call model providers, and separates observed facts from deterministic inference labels.

Import from `agent-inspect`:

```ts
import { buildLocalExplanation } from "agent-inspect/advanced";
```

- **`buildLocalExplanation(run, options?)`**:
  - **`mode: "dry-run"`**: returns redacted observed facts and no inference labels.
  - **`mode: "local"`** (default): returns observed facts plus deterministic local inference labels.
  - **`redactionProfile`**: `local`, `share`, or `strict`; profile keys are redacted before the payload is returned.

CLI wrapper: `agent-inspect explain <trace-path-or-run-id> --dry-run --json`.

Provider design gate:

- No provider payload is submitted in v1.9 implementation chunks; `--provider <provider>` is reserved and rejected with `PROVIDER_NOT_IMPLEMENTED`.
- The reviewable provider payload contract is the `ExplainResult` object: `mode`, `runId`, optional `name` / `status`, `redactionProfile`, `facts`, `inferences`, and `notes`.
- Provider implementations must require explicit provider selection and documented environment requirements. The current local API reads no provider credentials.
- Provider prompts must use redacted facts only, label inferred claims, and must not request raw chain-of-thought.
- Provider packages or SDKs must not become root/core runtime dependencies.

## 25. Experimental `@agent-inspect/harness` APIs

`@agent-inspect/harness` is a private experimental workspace package during the v1.9 release train. It provides a no-framework fixture runner for local targets and recipes; first public package publication remains a manual maintainer gate.

Import from `@agent-inspect/harness` inside the workspace:

```ts
import { createFixtureRunner, defineTarget } from "@agent-inspect/harness";
```

- **`defineTarget(definition)`**: returns a typed target definition with `resolve(app, context)` and `invoke(target, input, context)` hooks.
- **`createFixtureRunner(options)`**: returns a local runner with:
  - **`listTargets()`**: deterministic target metadata listing.
  - **`runTarget(name, input, options?)`**: bootstrap, resolve, invoke, and shutdown lifecycle.
  - **`runFromArgv(argv?, io?)`**: CLI-friendly execution with target listing, JSON fixture files, JSON stdin, JSON stdout, stderr summaries, trace flags, and expected-output comparison.
  - **`getDiagnostics()`**: deterministic diagnostics for missing targets, bootstrap failures, resolve failures, invocation failures, and shutdown failures.
- **`trace`** options use existing AgentInspect local APIs only:
  - **`mode: "run-if-enabled"`** (default): uses `maybeInspectRun()` and writes no trace unless `options.enabled` or `AGENT_INSPECT` enables tracing.
  - **`mode: "run"`**: explicitly wraps the target invocation in `inspectRun()`.
  - **`mode: "observe"`**: proxies the resolved target with `observe()` for `run` / `execute` / `invoke` methods when enabled.
  - **`mode: "off"`**: invokes the target without AgentInspect tracing.

The harness package does not add root/core dependencies, does not upload traces, does not call providers, and does not capture raw prompts or outputs by itself. It writes only local AgentInspect traces when explicitly enabled by runner options or environment-gated tracing.

Recipes: [harness-basic](../examples/recipes/harness-basic/README.md) and [harness-adapter-local](../examples/recipes/harness-adapter-local/README.md).

## 26. Deprecated APIs

No deprecated APIs are declared as of 1.4.0.

## 27. Removal / deprecation policy

- Stable APIs are not removed within the current major version.
- If removal is necessary, the API should be **deprecated** first, documented, and kept for a reasonable window (target: at least one minor line) unless security requires faster action.

## 28. Backward compatibility policy

- Manual trace JSONL (`schemaVersion: "0.1"`) remains readable.
- Additive schema changes are allowed in minor versions.
- Breaking changes require a major version.
- Unknown fields should be ignored where safe.

## 29. Examples

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
