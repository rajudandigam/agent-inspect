# API (AgentInspect 1.0)

This document describes the **public TypeScript API surface** of AgentInspect and classifies each area as **stable** or **experimental**.

AgentInspect is a **local-first execution-tree debugger**. It is not a SaaS, not a production APM, not a sink/uploader, and not a replay engine.

## 1. Stability policy

- **Stable**: intended to be compatible across v1.x. Breaking changes require v2.0.
- **Experimental**: available for adoption, but subject to refinement (including naming/shape changes) before a future stability declaration. Experimental APIs may change in v1.x.

Notes:

- The core guarantee of v1.0 is **stable local debugging**: manual tracing + CLI inspection.
- Export formats (OpenInference / OTLP JSON) are **local-only** and **compatibility-oriented**. They do **not** upload anywhere.
- There are **zero production sinks** in v1.0; sink/uploader APIs are not stable.

## 2. Stable core APIs (manual tracing)

These are the recommended entry points for manual instrumentation. They are designed to be dependency-light and safe-by-default.

Import from `agent-inspect`:

```ts
import { inspectRun, step, observe } from "agent-inspect";
```

- **`inspectRun(name, fn, options?)`**: wraps a workflow in a local JSONL trace (`run_started` / `run_completed`), prints terminal progress, and swallows instrumentation failures (user errors are re-thrown).
- **`step(name, fn, options?)`**: traces a named unit of work inside `inspectRun` (`step_started` / `step_completed`).
  - **`step.llm(model, fn)`**: convenience wrapper (`type: "llm"`, `metadata.model`).
  - **`step.tool(toolName, fn)`**: convenience wrapper (`type: "tool"`, `metadata.toolName`).
- **`observe(agent, options?)`**: proxy wrapper that traces top-level `run` / `execute` / `invoke` methods via `inspectRun`.

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

These are compatibility-oriented utilities for turning structured logs into normalized `InspectEvent` and grouped trees. They remain conservative: **no eval**, **no parsing JS object literals**, JSON logs first-class, log4js best-effort.

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

- **`exportRunTree`**
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
- Metadata helpers: `extractModelName`, `extractTokenUsage`, `safePreview`, `toPlainMetadata`

Rationale: v1.0 includes one official adapter and **zero production sinks**, so adapter surfaces remain experimental.

## 10. Experimental `@agent-inspect/tui` APIs

`@agent-inspect/tui` is an optional package. CLI integration via `agent-inspect view --tui` is supported; programmatic TUI APIs remain experimental.

- `runTraceViewer`, `loadTraceForTui`, `buildTuiTraceModel`, etc.

## 11. Deprecated APIs

No deprecated APIs are declared in v1.0 Pass 1.

## 12. Removal / deprecation policy

- Stable APIs are not removed in v1.x.
- If removal is necessary, the API should be **deprecated** first, documented, and kept for a reasonable window (target: at least one minor line) unless security requires faster action.

## 13. Backward compatibility policy

- Manual trace JSONL (`schemaVersion: "0.1"`) remains readable.
- Additive schema changes are allowed in minor versions.
- Breaking changes require a major version.
- Unknown fields should be ignored where safe.

## 14. Examples

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

