# API boundary design — v1.5.0 (Chunk 1)

**Status:** Design approved for Chunk 2 implementation  
**Baseline:** `agent-inspect@1.4.0`  
**Train:** [V1.5.0-EXECUTION-PLAN.md](./release-trains/V1.5.0-EXECUTION-PLAN.md) · **Milestone:** M1  
**Companion:** [API.md](../API.md) (stability policy) · [package.json](../../package.json) (exports map)

This document inventories the **full root export surface** today and proposes **additive, non-breaking subpath exports** for v1.5.0 Chunk 2. Root `"."` exports are **not removed** in v1.5.0.

---

## 1. Problem statement

Today `agent-inspect` exposes a **single export** (`"."`) that re-exports the entire `packages/core/src/index.ts` barrel (~150 symbols across tracing, logs, exporters, persisted converters, diff, and terminal helpers).

| Issue | Impact |
|-------|--------|
| **IntelliSense noise** | IDEs suggest log parsers, OTLP exporters, and persisted converters to users who only want `inspectRun` / `step` |
| **Unclear product tiers** | Stable tracing APIs sit beside experimental logs/export/diff surfaces with no import-path signal |
| **Bundle-size perception** | Tree-shaking works (`sideEffects: false`), but a large type graph slows `tsc` and obscures adoption path |
| **v2 preparation** | v2.0 needs a documented public boundary before any root surface reduction |

**v1.5.0 constraint:** Subpaths are **additive**. Existing `import { … } from "agent-inspect"` must keep working unchanged through v1.x.

---

## 2. Current package exports (v1.4.0)

Root [package.json](../../package.json) `exports`:

```json
{
  ".": {
    "import": { "types": "./packages/core/dist/index.d.ts", "default": "./packages/core/dist/index.mjs" },
    "require": { "types": "./packages/core/dist/index.d.cts", "default": "./packages/core/dist/index.cjs" }
  }
}
```

| Property | Value |
|----------|-------|
| **Published name** | `agent-inspect` (root tarball bundles `packages/core/dist` + `packages/cli/dist`) |
| **Entry** | `packages/core/src/index.ts` → single barrel |
| **Subpaths** | None |
| **Side effects** | `false` |
| **Runtime deps** | `chalk`, `commander`, `nanoid` only |

**Separate npm packages** (not covered by this subpath design):

| Package | Role |
|---------|------|
| `@agent-inspect/langchain` | Optional LangChain callback adapter |
| `@agent-inspect/tui` | Optional terminal UI viewer |

---

## 3. Full export inventory

Source: [packages/core/src/index.ts](../../packages/core/src/index.ts) at v1.4.0.  
Stability labels follow [API.md](../API.md).

### 3.1 Core tracing (stable) — **root recommended**

| Symbol | Kind | Notes |
|--------|------|-------|
| `inspectRun` | function | Primary workflow wrapper |
| `maybeInspectRun` | function | Env-gated tracing |
| `isAgentInspectEnabled` | function | `AGENT_INSPECT` helper |
| `step` | function | Includes `.llm`, `.tool` |
| `observe` | function | Agent proxy wrapper |
| `getCurrentCorrelationMetadata` | function | v1.3.0 correlation fields |

**Types:** `InspectRunOptions`, `StepOptions`, `ObserveOptions`, `RedactionProfile`, `TraceCorrelationMetadata`, `ExecutionContext`, `ActiveStepContext`

### 3.2 Manual trace model (stable) — **root recommended**

| Symbol | Kind |
|--------|------|
| `isTraceEvent`, `isStepType`, `isStepStatus` | guards |
| `TraceSchemaVersion`, `TraceEvent`, `RunStartedEvent`, `RunCompletedEvent`, `StepStartedEvent`, `StepCompletedEvent` | types |
| `StepType`, `StepStatus`, `RunStatus`, `ErrorInfo`, `TokenMetadata`, `StepMetadata`, `Run`, `Step` | types |
| `TraceMetadataStatus`, `TraceMetadata`, `RunSummary` | types |

### 3.3 Storage & I/O (stable) — **root recommended**

| Symbol | Kind |
|--------|------|
| `serializeEvent`, `validateEvent`, `initializeTraceFile`, `writeTraceEvent`, `readTraceFile`, `readTraceEvents`, `listTraceFiles`, `getRunIdFromTraceFileName` | functions |
| `TraceDirectory`, `resolveTraceDir` | class / function |
| `TraceDirectoryOptions` | type |

### 3.4 Local inspection (stable) — **root recommended**

| Symbol | Kind |
|--------|------|
| `extractMetadata`, `buildRunSummary` | functions |
| `filterTraces` | function |
| `buildRunTimeline`, `renderTimeline` | functions |
| `buildTraceStats`, `renderTraceStats` | functions |
| `searchTraces`, `parseDurationFilter`, `loadTraceMetadataList` | functions |
| `isAgentInspectTrace` | function |
| `parseDuration`, `formatDuration`, `formatTimestamp` | functions |
| `TimelineFocus`, `TimelineEntry`, `RunTimeline`, `TimelineOptions`, `RenderTimelineOptions` | types |
| `DurationStats`, `TraceStatsRankedRun`, `TraceStatsRankedStep`, `TraceStats`, `TraceStatsOptions` | types |
| `TraceSearchOptions`, `TraceSearchResult`, `ParsedDurationFilter` | types |
| `TraceFilterOptions` | type |

### 3.5 InspectEvent model (stable types) — **root recommended**

Shared between manual traces and log-derived trees:

| Symbol | Kind |
|--------|------|
| `InspectKind`, `AttributionConfidence`, `EventSource`, `InspectEvent`, `InspectNode`, `InspectRunTree` | types |

### 3.6 Advanced / integration (stable, narrow audience) — **`agent-inspect/advanced`**

Used by adapters and power users; rarely needed in application code:

| Symbol | Kind | Notes |
|--------|------|-------|
| `getCurrentContext`, `getCurrentRunId`, `getCurrentRunName`, `getCurrentStepId`, `getParentStepId`, `getCurrentDepth`, `getTraceDirFromContext`, `isSilentContext`, `hasActiveContext`, `runWithContext`, `runWithStepContext`, `getTraceSafetyFromContext` | functions | Execution context |
| `prepareMetadataForDisk`, `prepareTraceEventForDisk`, `resolveRedactionProfile`, `resolveTraceSafetyOptions` | functions | Safety pipeline |
| `DEFAULT_MAX_EVENT_BYTES`, `DEFAULT_MAX_METADATA_VALUE_LENGTH`, `DEFAULT_MAX_PREVIEW_LENGTH` | constants | Size bounds |
| `ResolvedRedactionProfile`, `TraceSafetyOptions` | types | |
| `createRunId`, `createStepId`, `getDefaultTraceDir`, `getTraceFilePath`, `ensureTraceDir`, `formatError`, `truncateName`, `warn` | functions | Low-level utils |
| `DEFAULT_TRACE_DIR_NAME`, `RUNS_DIR_NAME`, `FALLBACK_TRACE_DIR`, `MAX_NAME_LENGTH` | constants | |
| `TERMINAL_INDENT`, `MAX_TERMINAL_NAME_LENGTH`, `MAX_TERMINAL_DEPTH`, `getIndent`, `formatTerminalName`, `printRunStart`, `printStepStart`, `printStepComplete`, `printRunComplete`, `printError`, `printFailedAt`, `renderStepLine`, `renderErrorLine`, `renderRunSummary` | functions / constants | Terminal progress output |

### 3.7 Persisted InspectEvent (experimental) — **`agent-inspect/persisted`**

| Symbol | Kind |
|--------|------|
| `isPersistedInspectEvent` | guard |
| `traceEventToPersistedInspectEvent`, `traceEventsToPersistedInspectEvents` | converters |
| `inspectEventToPersistedInspectEvent`, `inspectEventsToPersistedInspectEvents` | converters |
| `persistedInspectEventToInspectEvent`, `persistedInspectEventsToInspectEvents` | converters |
| `persistedInspectEventsToRunTrees`, `traceEventsToPersistedRunTrees` | tree bridge |
| `PersistedSchemaVersion`, `PersistedEventSourceType`, `PersistedEventSource`, `PersistedEventStatus`, `PersistedInspectError`, `PersistedTokenUsage`, `PersistedTraceContext`, `PersistedInspectEvent` | types |
| `TraceEventToPersistedOptions`, `InspectEventToPersistedOptions`, `PersistedToInspectEventOptions`, `PersistedTreeBridgeOptions` | types |

### 3.8 Structured logs (experimental) — **`agent-inspect/logs`**

| Symbol | Kind |
|--------|------|
| `parseLogsToTrees`, `parseLogLine` | functions |
| `JsonLogParser`, `Log4jsParser`, `EventNormalizer`, `TreeBuilder`, `Redactor`, `LiveLogAccumulator` | classes |
| `renderRunTree`, `renderRunTrees` | functions |
| `wildcardMatch`, `matchMapping` | functions |
| `DEFAULT_LOG_INGEST_CONFIG`, `loadLogIngestConfig`, `mergeLogIngestConfig` | config |
| `LogIngestConfig`, `LogEventMapping`, `RedactionStrategy`, `RedactionRule` | types |
| `ParserWarningCode`, `ParserWarning`, `ParseResult`, `RawLogRecord`, `RedactorOptions`, `NormalizeOptions`, `TreeBuilderOptions`, `RenderTreeOptions`, `ParseLogsOptions`, `LogToTreeResult`, `LogSourceFormat`, `ParseLogLineOptions`, `LiveLogUpdate`, `LiveLogAccumulatorOptions` | types |
| `DEFAULT_REDACT_KEYS` | constant |

### 3.9 Standards export (experimental) — **`agent-inspect/exporters`**

| Symbol | Kind |
|--------|------|
| `exportRunTree`, `redactRunTreeForExport`, `validateExport`, `validateExportContent` | functions |
| `exportMarkdown`, `exportHtml`, `exportOpenInference`, `exportOtlpJson` | functions |
| `manualTraceEventsToRunTree`, `mergeExportDefaults` | functions |
| `safeString`, `escapeMarkdown`, `escapeHtml`, `stableJson`, `compactAttributes`, `summarizeTree`, `flattenTree` | helpers |
| `ExportFormat`, `ExportOptions`, `ExportResult`, `ExportValidationResult`, `TraceExporter` | types |
| `EXPORT_PAYLOAD_VERSION` | constant |
| `OpenInferenceExport`, `OpenInferenceSpan` | types |

### 3.10 Diff (experimental) — **`agent-inspect/diff`**

| Symbol | Kind |
|--------|------|
| `diffRuns`, `diffTraceEvents`, `renderRunDiff`, `manualTraceEventsToComparableRun` | functions |
| `DiffSeverity`, `DiffKind`, `DiffPathSegment`, `DiffPath`, `RunDiffItem`, `StepComparable`, `RunComparable`, `RunDiffSummary`, `RunDiffResult`, `DiffOptions`, `RenderDiffOptions` | types |

### 3.11 Inventory summary

| Domain | Symbol count (approx.) | Stability | Proposed subpath |
|--------|------------------------|-----------|------------------|
| Core tracing + trace model + storage + inspection | ~75 | Stable | `.` (root) |
| InspectEvent shared types | ~5 | Stable | `.` (root) |
| Advanced / context / terminal / safety | ~35 | Stable (narrow) | `./advanced` |
| Persisted v0.2 | ~20 | Experimental | `./persisted` |
| Structured logs | ~30 | Experimental | `./logs` |
| Exporters | ~20 | Experimental | `./exporters` |
| Diff | ~15 | Experimental | `./diff` |

**Total:** ~150 exported symbols from root today (types + values).

---

## 4. Proposed subpath layout (Chunk 2)

### 4.1 Subpath map

| Subpath | Resolves to (new entry file) | Audience |
|---------|------------------------------|----------|
| `agent-inspect` | `packages/core/dist/index.*` (unchanged) | Default — tracing + local inspection |
| `agent-inspect/advanced` | `packages/core/dist/advanced.*` | Adapter authors, context/safety/terminal |
| `agent-inspect/persisted` | `packages/core/dist/persisted.*` | v0.2 model integrators |
| `agent-inspect/logs` | `packages/core/dist/logs.*` | Log-to-tree pipelines |
| `agent-inspect/exporters` | `packages/core/dist/exporters-public.*` | Share/export workflows |
| `agent-inspect/diff` | `packages/core/dist/diff-public.*` | Regression / comparison tooling |

Each subpath must expose **identical ESM/CJS conditional types** as root:

```json
"./advanced": {
  "import": { "types": "./packages/core/dist/advanced.d.ts", "default": "./packages/core/dist/advanced.mjs" },
  "require": { "types": "./packages/core/dist/advanced.d.cts", "default": "./packages/core/dist/advanced.cjs" }
}
```

(Pattern repeats for `./persisted`, `./logs`, `./exporters`, `./diff`.)

### 4.2 Root retention policy (v1.5.0)

| Rule | Rationale |
|------|-----------|
| **Root re-exports everything** | Zero breaking change for existing consumers (`@agent-inspect/langchain`, examples, compat fixtures) |
| **Subpaths are strict subsets** | Each symbol appears on exactly one subpath **plus** root |
| **No new root symbols in Chunk 2** | Subpath wiring only; API additions wait for later chunks |
| **Docs recommend subpaths for new code** | Gradual adoption; no forced migration in v1.5.0 |

### 4.3 v2.0 direction (not v1.5.0)

v2.0 may **stop re-exporting** experimental domains from root while keeping subpaths and a documented migration window. This document is the inventory gate for that decision.

---

## 5. Consumer migration guide

### 5.1 No action required (v1.5.0)

Existing imports remain valid:

```ts
import { inspectRun, step, readTraceEvents } from "agent-inspect";
import { exportMarkdown } from "agent-inspect";
import { parseLogsToTrees } from "agent-inspect";
```

`api-stability.test.ts` and `compat:smoke` must continue to pass without changes.

### 5.2 Recommended imports for new code (after Chunk 2)

```ts
// Tracing + CLI-oriented inspection (default)
import { inspectRun, step, buildTraceStats } from "agent-inspect";

// Experimental — prefer subpaths
import { parseLogsToTrees } from "agent-inspect/logs";
import { exportMarkdown } from "agent-inspect/exporters";
import { diffTraceEvents } from "agent-inspect/diff";
import { traceEventsToPersistedInspectEvents } from "agent-inspect/persisted";
import { runWithContext, printStepStart } from "agent-inspect/advanced";
```

### 5.3 Internal workspace packages

| Consumer | Today | v1.5.0 guidance |
|----------|-------|-----------------|
| `@agent-inspect/langchain` | Root imports (`readTraceEvents`, `inspectRun`, …) | Keep root imports; optional follow-up PR to `advanced` for context helpers |
| `@agent-inspect/tui` | Root imports | Keep root imports |
| `examples/*` | Root tracing only | No change required |
| `test/consumer-fixtures/*` | Root ESM/CJS | Extend with subpath fixture in Chunk 2 |

---

## 6. IntelliSense and bundle-size rationale

### IntelliSense

TypeScript resolves all exports from a single `index.d.ts` (~thousands of lines). Narrowing import paths:

- Reduces autocomplete clutter for the primary tracing use case
- Signals stability tier at import site (`/logs` = experimental)
- Aligns docs ([API.md](../API.md) §5–8) with physical module boundaries

### Bundle size

- `sideEffects: false` allows bundlers to tree-shake unused modules regardless of import path
- Subpaths do **not** duplicate runtime code in the published tarball — only additional entry points into the same built files
- **Typecheck cost** may improve marginally when consumers import subpaths (smaller `.d.ts` per entry); measure in Chunk 2 if needed

### Size-limit baseline

Current `pnpm size` tracks root entry. Chunk 2 should **not** regress size-limit config; subpath entries are re-exports, not new code.

---

## 7. Chunk 2 implementation checklist

Derived from this design — **do not start until Chunk 1 is committed (Gate B)**.

- [ ] Add tsup entry points: `advanced`, `persisted`, `logs`, `exporters-public`, `diff-public`
- [ ] Update root `package.json` `exports` map (5 subpaths + `.`)
- [ ] Keep `packages/core/src/index.ts` as superset barrel (unchanged symbols)
- [ ] Add consumer compat fixtures: ESM + CJS subpath imports per subpath
- [ ] Extend `pnpm compat:smoke` if needed
- [ ] Update [API.md](../API.md) import examples for subpaths
- [ ] Validation: export level per [ROADMAP-EXECUTION-V1.5-TO-V2.md §8](./ROADMAP-EXECUTION-V1.5-TO-V2.md#8-validation-matrix)

### Explicit Chunk 2 non-goals

- Removing symbols from root
- New runtime dependencies
- CLI changes
- Version bump / changeset (waits for train Gate D)

---

## 8. Verification references

| Check | Location |
|-------|----------|
| Stable API existence | `packages/core/test/api-stability.test.ts` |
| ESM/CJS consumer resolution | `packages/core/test/package-exports-compat.test.ts`, `test/consumer-fixtures/` |
| Package boundary rules | `packages/core/test/package-boundaries.test.ts` |
| Stability policy | [API.md](../API.md) |

---

## 9. Related

- [V1.5.0-EXECUTION-PLAN.md](./release-trains/V1.5.0-EXECUTION-PLAN.md) — Chunk 1 (this doc) · Chunk 2 (implementation)
- [ROADMAP-EXECUTION-V1.5-TO-V2.md](./ROADMAP-EXECUTION-V1.5-TO-V2.md) — migration risks §15
- [UNIFIED-PERSISTED-INSPECT-EVENT.md](../proposals/UNIFIED-PERSISTED-INSPECT-EVENT.md) — persisted model context
