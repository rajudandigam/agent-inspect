# AgentInspect Canonical Implementation Roadmap

## v1.5.0 → v2.0 → v3.0

## 1. Executive decision

AgentInspect should become:

> **The universal local reader, debugger, differ, and CI checker for TypeScript agent traces.**

The winning product is not another AI observability platform.

It is the small, dependable utility developers reach for when they need to:

* open an agent trace
* understand what happened
* find the first failure
* inspect tools, models, retrievals, retries, handoffs, and branches
* compare a run with a known-good baseline
* assert deterministic behavioral expectations
* generate share-safe CI evidence
* keep all data local unless export is explicitly requested

The clearest public promise is:

> **Open any TypeScript agent trace locally. Understand it, diff it, and assert on it—without an account or collector.**

Useful mental models:

```text
jq for agent traces
git diff for agent runs
Vitest-style assertions for agent behavior
```

AgentInspect should not try to become the universal telemetry standard. It should become the best local developer utility for traces produced through AgentInspect, OpenInference, OpenTelemetry, AI SDK, OpenAI Agents, LangChain/LangGraph, and other TypeScript agent frameworks.

---

# 2. Product boundaries

## AgentInspect is

* a local-first agent-trace utility
* a trace reader and normalizer
* an execution-tree debugger
* a deterministic trace comparison tool
* a trace assertion and CI artifact tool
* a privacy-conscious inspection workflow
* a framework-native local trace destination
* a standards-compatible bridge
* a library that can coexist with production observability

## AgentInspect is not

* a hosted SaaS
* a multi-tenant dashboard
* a production APM replacement
* a fleet-wide telemetry collector
* a prompt registry
* an eval dataset manager
* an LLM-as-judge platform
* a provider pricing database
* a billing or cost engine
* a default network uploader
* a universal monkey-patching framework
* a raw chain-of-thought capture system
* a default replay or cassette engine
* an automatic remediation system

## The product loop

```text
framework / SDK / local code / trace file
                    ↓
         AgentInspect normalization
                    ↓
 tree / timeline / what / report / search
                    ↓
       diff / check / assert / CI artifact
                    ↓
 optional OpenInference / OTLP / production bridge
```

---

# 3. Primary adoption wedges

## 3.1 Framework-native local debugging

The developer adds one supported integration to AI SDK, OpenAI Agents, or LangGraph and receives a local trace without manually wrapping every model and tool call.

Desired experience:

```ts
experimental_telemetry: {
  isEnabled: true,
  recordInputs: false,
  recordOutputs: false,
  integrations: [agentInspect()]
}
```

Or:

```ts
setTraceProcessors([
  agentInspectTraceProcessor()
]);
```

## 3.2 Failed agent-test diagnostics

The product promise:

> **A failed agent test always leaves enough evidence to understand why.**

Expected artifacts:

```text
trace.jsonl
trace.md
trace.html
diff.md
check-results.json
```

## 3.3 Universal local inspection

The simplest workflow should not require AgentInspect instrumentation:

```bash
agent-inspect open ./trace.json
agent-inspect what ./trace.json
agent-inspect diff baseline.json candidate.json
agent-inspect check candidate.json
```

## 3.4 Privacy-sensitive development

AgentInspect should remain attractive where traces cannot automatically leave the developer machine.

This means:

* no upload by default
* no account
* metadata-oriented capture defaults
* explicit prompt/output capture
* redaction before persistence
* share-safe export
* an exact preview of what would leave the machine

## 3.5 Complementing existing production observability

AgentInspect should support teams that already use:

* LangSmith
* Langfuse
* Braintrust
* Phoenix
* Datadog
* New Relic
* Honeycomb
* OpenTelemetry collectors

AgentInspect handles the local and CI loop. Existing platforms may continue handling production monitoring, long-term retention, datasets, evaluations, collaboration, and alerts.

---

# 4. Current v1.5.0 baseline

## Already available

* `inspectRun`
* `maybeInspectRun`
* `step`
* `step.llm`
* `step.tool`
* `observe`
* AsyncLocalStorage context
* local v0.1 JSONL traces
* v0.2 persisted-event model
* v0.1 and v0.2 readers
* correlation metadata
* redaction profiles
* bounded events and previews
* structured-log ingestion
* live log tailing
* LangChain persistence and streaming metadata
* `list`
* `view`
* `clean`
* `logs`
* `tail`
* `export`
* `diff`
* `timeline`
* `stats`
* `search`
* `what`
* `report`
* Markdown and HTML reports
* OpenInference-compatible export
* OTLP JSON export
* CI artifact recipe
* optional TUI
* compatibility and package smoke tests

## Current architectural debt

### Two persisted trace formats

```text
v0.1 manual trace format
v0.2 normalized / adapter persisted format
```

This is acceptable during 1.x, but cannot remain the long-term story.

### Broad root API

Subpaths exist, but advanced internals remain visible from the root.

### Filesystem-coupled runtime

Instrumentation writes directly to files rather than through a configurable writer.

### Limited framework-native distribution

LangChain is the only substantial adapter.

### Passive traces

The current commands inspect and report, but deterministic behavioral assertions are not yet first-class.

### Limited session and cross-run navigation

Correlation metadata exists, but multi-run conversations, handoffs, retries, attempts, and sessions are not yet a complete workflow.

---

# 5. Target architecture

The target architecture should have six stable layers.

```text
1. Trace sources
2. Readers and adapters
3. Normalized event contract
4. Writers and storage
5. Inspection and checks
6. Renderers and integrations
```

## Layer 1 — Trace sources

Sources may include:

* manual AgentInspect instrumentation
* AgentInspect persisted files
* AI SDK telemetry
* OpenAI Agents trace processors
* LangChain callbacks
* LangGraph graph events
* Mastra exporters
* OpenInference traces
* OTLP JSON
* MCP activity
* structured logs

## Layer 2 — Readers and adapters

Each source maps into the same normalized model.

```ts
interface TraceReader {
  readonly format: string;

  canRead(input: TraceInput): boolean | Promise<boolean>;

  read(
    input: TraceInput,
    options?: TraceReadOptions
  ): Promise<TraceReadResult>;
}
```

Framework adapters should use supported lifecycle or tracing hooks. They should not patch framework internals.

## Layer 3 — Normalized event contract

The v0.2 `PersistedInspectEvent` model should remain the canonical 1.x normalized model.

Do not introduce a third experimental persisted format before v2.

The stable v2 model should include:

```ts
interface AgentEvent {
  schemaVersion: "1.0";

  eventId: string;
  runId: string;
  parentId?: string;

  sessionId?: string;
  groupId?: string;
  parentGroupId?: string;

  correlationId?: string;
  requestId?: string;
  decisionId?: string;
  jobId?: string;

  kind:
    | "RUN"
    | "AGENT"
    | "CHAIN"
    | "LLM"
    | "TOOL"
    | "RETRIEVER"
    | "RERANKER"
    | "EMBEDDING"
    | "GUARDRAIL"
    | "EVALUATOR"
    | "PROMPT"
    | "DECISION"
    | "ERROR"
    | "LOG";

  name: string;

  status?:
    | "running"
    | "ok"
    | "error"
    | "cancelled"
    | "unknown";

  timestamp: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;

  source: {
    type: string;
    name?: string;
    version?: string;
  };

  confidence:
    | "explicit"
    | "correlated"
    | "heuristic"
    | "unknown";

  tokens?: {
    input?: number;
    output?: number;
    total?: number;
    cached?: number;
    reasoning?: number;
  };

  error?: {
    name?: string;
    message: string;
    code?: string;
    stack?: string;
  };

  attributes?: Record<string, unknown>;

  redaction?: {
    profile?: string;
    redactedPaths?: string[];
    truncated?: boolean;
  };

  traceContext?: {
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    traceFlags?: number;
  };
}
```

The exact v2 schema must be frozen through an RFC and conformance fixtures. The structure above is the design target, not an immediate public commitment.

## Layer 4 — Writers

```ts
interface TraceWriter {
  write(event: PersistedInspectEvent): void | Promise<void>;
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
}
```

Initial writers:

* direct file writer
* buffered file writer
* memory writer
* null writer
* composite writer

Later optional writers:

* OTLP HTTP writer
* stream writer
* custom user writers

## Layer 5 — Inspection and checks

Every command should consume the normalized model:

* tree
* timeline
* search
* stats
* what
* report
* diff
* check
* assert
* cohort
* session navigation

## Layer 6 — Outputs

* terminal tree
* JSON
* Markdown
* static HTML
* GitHub step summary
* share-safe artifact
* OpenInference
* OTLP JSON
* optional local viewer
* read-only MCP tools

---

# 6. Canonical release sequence

| Release                  | Theme                                      | Primary outcome                                           |
| ------------------------ | ------------------------------------------ | --------------------------------------------------------- |
| Immediate docs alignment | Roadmap reset                              | One active roadmap and corrected release state            |
| v1.6.0                   | Runtime foundation and universal ingestion | Instance API, writer contract, external trace reader      |
| v1.7.0                   | Framework-native adoption                  | AI SDK, OpenAI Agents, enhanced LangGraph                 |
| v1.8.0                   | Deterministic checks and CI                | Check/assert, reporters, safe artifacts                   |
| v1.9.0                   | Sessions, conformance, v2 freeze           | Cross-run debugging and ecosystem contract                |
| v2.0.0                   | Stable utility contract                    | Small root API, schema 1.0, stable readers/writers/checks |
| v2.x                     | Ecosystem expansion                        | MCP, Mastra, diagnostic mode, viewer, adapter SDK         |
| v3.0                     | Extensible trace toolchain                 | Stable plugin ecosystem, conditional on adoption          |

---

# 7. Immediate action — roadmap and documentation alignment

## Goal

Remove conflicting roadmap states before implementing v1.6.

## Required changes

* Mark v1.5.0 as published in all maintainer tables.
* Change any v1.5.0 “planning” or “in progress” status to released.
* Update the execution program baseline from v1.4.0 to v1.5.0.
* Mark the old v1.6 AI-SDK-only plan as superseded.
* Establish this document as the canonical roadmap.
* Add an architecture RFC index.
* Add a product-validation dashboard document.
* Update issue #30 or replace it with an implementation-ready AI SDK integration RFC.
* Link each future issue to its correct release train.
* Archive or clearly label outdated roadmap documents.

## New planning documents

```text
docs/implementation/ROADMAP-V1.6-TO-V3.md
docs/proposals/INSPECTOR-RUNTIME.md
docs/proposals/TRACE-WRITER.md
docs/proposals/TRACE-READER.md
docs/proposals/STABLE-SCHEMA-1.0.md
docs/product/ADOPTION-METRICS.md
```

## Validation

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Release impact

No version bump is required unless public npm-package documentation changes materially.

---

# 8. v1.6.0 — Runtime Foundation and Universal Trace Ingestion

## Release goal

Create the architecture that every adapter, writer, reader, and future check can share.

The central shift is:

```text
Before:
AgentInspect instruments an application and reads its own files.

After:
AgentInspect can instrument an application or read traces produced elsewhere.
```

## Why this release comes first

Framework adapters should not write directly into current filesystem helpers.

CI checks should not implement format-specific parsing.

A production-adjacent runtime needs configurable writing and flushing.

External traces need a normalized local read path.

Therefore, the inspector runtime, writer contract, and reader contract must precede broader adapters and checks.

---

## v1.6 scope A — Experimental instance API

### API

```ts
import {
  createInspector,
  fileWriter
} from "agent-inspect/advanced";

const inspector = createInspector({
  enabled: true,
  writer: fileWriter({
    dir: ".agent-inspect"
  }),
  redactionProfile: "local",
  capture: {
    onSuccess: "metadata-only",
    onError: "metadata-only"
  }
});

await inspector.run("support-agent", async () => {
  const policy = await inspector.tool(
    "retrieve-policy",
    retrievePolicy
  );

  return inspector.llm(
    "generate-answer",
    () => generateAnswer(policy)
  );
});

await inspector.flush();
```

### Inspector contract

```ts
interface Inspector {
  run<T>(
    name: string,
    fn: () => T | Promise<T>,
    options?: InspectorRunOptions
  ): Promise<T>;

  step<T>(
    name: string,
    fn: () => T | Promise<T>,
    options?: InspectorStepOptions
  ): Promise<T>;

  tool<T>(
    name: string,
    fn: () => T | Promise<T>,
    options?: InspectorStepOptions
  ): Promise<T>;

  llm<T>(
    name: string,
    fn: () => T | Promise<T>,
    options?: InspectorStepOptions
  ): Promise<T>;

  observe<TFunction extends (...args: any[]) => any>(
    name: string,
    fn: TFunction,
    options?: ObserveOptions
  ): TFunction;

  flush(): Promise<void>;
  close(): Promise<void>;
}
```

### Required behavior

* preserve application return values
* rethrow application errors unchanged
* never replace an application error with an instrumentation error
* support multiple independent inspector instances
* maintain instance-specific AsyncLocalStorage
* support nested runs and steps
* support parallel branches
* preserve correlation metadata
* apply safety before writing
* allow disabled passthrough
* allow in-memory test capture
* support deterministic shutdown

### Compatibility decision

During 1.x:

* existing global APIs remain unchanged
* existing APIs continue writing v0.1
* the experimental instance API may write v0.2
* do not force existing consumers onto the new API
* do not remove root exports

In v2:

* global functions become wrappers over a default inspector
* the stable default writer writes schema 1.0

### Important mixing rule

Do not promise that global `step()` automatically attaches to a custom inspector’s run during the first implementation.

Require:

```ts
inspector.run(...)
inspector.step(...)
inspector.tool(...)
inspector.llm(...)
```

Mixing custom-inspector and global APIs should either:

* be explicitly unsupported in v1.6, or
* be implemented only after context-isolation tests prove correctness

Avoid hidden cross-instance behavior.

---

## v1.6 scope B — TraceWriter contract

### Public experimental subpath

```ts
import {
  fileWriter,
  bufferedFileWriter,
  memoryWriter,
  nullWriter,
  compositeWriter
} from "agent-inspect/writers";
```

### Direct file writer

Responsibilities:

* create trace directory safely
* write one normalized event
* preserve ordering
* apply atomic or append-safe behavior
* expose flush and close
* return instrumentation errors to the inspector runtime, not the application

### Buffered writer

Configuration:

```ts
bufferedFileWriter({
  dir: ".agent-inspect",
  maxQueueSize: 1000,
  flushIntervalMs: 250,
  maxBatchSize: 100,
  overflow: "drop-oldest"
});
```

Supported overflow modes:

* `drop-oldest`
* `drop-newest`

Do not offer an overflow mode that throws into user code.

Expose statistics:

```ts
interface TraceWriterStats {
  writtenEvents: number;
  droppedEvents: number;
  flushCount: number;
  lastFlushAt?: string;
  lastError?: string;
}
```

### Memory writer

Use cases:

* unit tests
* adapter tests
* eval harnesses
* framework conformance
* deterministic snapshots

### Null writer

Use cases:

* disabled mode
* performance comparisons
* integration tests
* explicit no-output runs

### Composite writer

Use cases:

* file plus test observer
* file plus explicit custom writer
* future file plus OTLP writer

Composite behavior:

* one failing child writer must not prevent other writers
* failures must be reported through instrumentation diagnostics
* application execution must continue

### Writer safety

Every writer must pass:

* application error preservation
* serialization failure
* directory permission failure
* partial write failure
* close during pending flush
* repeated close
* repeated flush
* concurrent writes
* queue overflow
* process shutdown simulation
* large bounded event
* redacted event

---

## v1.6 scope C — TraceReader contract

### Public experimental subpath

```ts
import {
  openTrace,
  readTrace,
  detectTraceFormat
} from "agent-inspect/readers";
```

### Reader input

```ts
type TraceInput =
  | { type: "file"; path: string }
  | { type: "directory"; path: string }
  | { type: "string"; content: string }
  | { type: "buffer"; content: Buffer }
  | { type: "stdin" };
```

### Read result

```ts
interface TraceReadResult {
  format: string;
  events: PersistedInspectEvent[];
  runs: InspectRunTree[];
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
  sourceFiles: string[];
}
```

### Built-in readers

* AgentInspect v0.1 JSONL
* AgentInspect v0.2 JSONL
* OpenInference JSON
* OTLP/HTTP JSON trace payload

### Format detection rules

Format detection must be:

* deterministic
* ordered
* inspectable
* conservative
* overrideable with `--format`
* capable of reporting ambiguity

Never silently treat arbitrary JSON as a valid trace.

### Reader warnings

Examples:

* unsupported span kind
* missing parent ID
* malformed timestamp
* invalid duration
* missing status
* unknown semantic attribute
* event skipped
* multiple possible roots
* truncated source payload
* incompatible schema version

### Ingestion requirements

* preserve source IDs
* preserve trace IDs and span IDs
* preserve explicit parent-child relationships
* preserve unknown attributes under a safe extension namespace
* preserve source package/framework metadata
* map standard span kinds into AgentInspect kinds
* retain import warnings
* never fabricate a relationship without a confidence label
* never modify the source file
* require no OTel SDK in core

---

## v1.6 scope D — Universal `open` command

### CLI

```bash
agent-inspect open ./trace.json
agent-inspect open ./trace.jsonl
agent-inspect open ./traces/
agent-inspect open - --format otlp-json
agent-inspect open ./trace.json --json
agent-inspect open ./trace.json --diagnostics
agent-inspect open ./trace.json --run <run-id>
```

### Behavior

For one run:

* render concise summary
* render tree
* show source format
* show warning count

For multiple runs:

* show run list
* show statuses and durations
* allow `--run`
* avoid choosing an arbitrary run silently

### Integration with current commands

Current commands should progressively accept either:

```text
run ID + --dir
```

or:

```text
file/directory input
```

Examples:

```bash
agent-inspect what ./trace.json
agent-inspect timeline ./trace.json
agent-inspect report ./trace.json
agent-inspect diff baseline.json candidate.json
```

Do not duplicate parsing logic across commands.

---

## v1.6 scope E — Root API transition

### Current 1.x behavior

Keep existing root exports functional.

### Add deprecation metadata

Advanced root exports should receive JSDoc deprecations pointing to:

* `agent-inspect/advanced`
* `agent-inspect/persisted`
* `agent-inspect/logs`
* `agent-inspect/exporters`
* `agent-inspect/diff`
* `agent-inspect/readers`
* `agent-inspect/writers`

### Documented recommended root surface

```ts
inspectRun
maybeInspectRun
step
observe
getCurrentCorrelationMetadata
createInspector // experimental during 1.x
```

Do not remove advanced exports before v2.

---

## v1.6 implementation chunks

### Chunk 0 — Planning and architecture RFCs

Files:

```text
docs/proposals/INSPECTOR-RUNTIME.md
docs/proposals/TRACE-WRITER.md
docs/proposals/TRACE-READER.md
docs/proposals/STABLE-SCHEMA-1.0.md
```

No runtime changes.

### Chunk 1 — Writer types and memory/null writers

Implement:

* `TraceWriter`
* `TraceWriterStats`
* memory writer
* null writer
* tests

### Chunk 2 — Direct file writer

Implement:

* normalized event file persistence
* ordering
* flush
* close
* failure isolation

### Chunk 3 — Buffered and composite writers

Implement:

* bounded queue
* flush timer
* batch writes
* dropped-event counters
* composite failure isolation

### Chunk 4 — Inspector runtime context

Implement:

* instance-specific AsyncLocalStorage
* runtime IDs
* nested steps
* parallel branches
* safety policy
* instrumentation diagnostics

### Chunk 5 — `createInspector`

Implement:

* run
* step
* tool
* llm
* observe
* flush
* close
* disabled mode

### Chunk 6 — Reader contract and v0.1/v0.2 readers

Consolidate the existing dual reader behind the new interface.

### Chunk 7 — OpenInference reader

Implement pure JSON mapping and import diagnostics.

### Chunk 8 — OTLP JSON reader

Implement pure JSON mapping and import diagnostics.

### Chunk 9 — `open` CLI

Add file, directory, stdin, explicit format, JSON, and diagnostics behavior.

### Chunk 10 — Current command integration

Make `what`, `timeline`, `report`, `diff`, and search helpers consume the shared reader pipeline.

### Chunk 11 — Recipes and documentation

Add:

```text
examples/recipes/open-agentinspect-trace
examples/recipes/open-openinference-trace
examples/recipes/open-otlp-json
examples/recipes/custom-inspector-memory-writer
examples/recipes/buffered-writer
```

### Chunk 12 — Release readiness

* compatibility smoke
* package smoke
* size validation
* failure testing
* performance baseline
* README/ROADMAP/CHANGELOG alignment

---

## v1.6 release gate

Required:

* all existing v0.1 traces remain readable
* v0.2 traces remain readable
* current global tracing behavior remains compatible
* OpenInference and OTLP fixtures are inspectable
* custom inspector has no cross-instance context leaks
* instrumentation failure never breaks application behavior
* no network writer exists in root
* root runtime dependencies remain unchanged
* all new subpaths pass ESM and CJS tests
* recipes demonstrate each major workflow
* at least two external users test `open`
* at least one external user tests `createInspector`

---

# 9. v1.7.0 — Framework-Native Adoption

## Release goal

Make AgentInspect easy to adopt in the TypeScript agent ecosystems that already produce structured lifecycle information.

This release should prove:

```text
framework integration
→ local normalized trace
→ existing AgentInspect CLI and reports
```

---

## v1.7 scope A — `@agent-inspect/ai-sdk`

### Integration strategy

Use AI SDK's supported telemetry integration lifecycle.

Do not:

* patch `generateText`
* patch `streamText`
* patch providers
* patch global fetch
* wrap every tool manually

### Intended usage

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
        capture: "metadata-only"
      })
    ]
  }
});
```

### Capture mapping

#### Generation start

Map to root or chain event.

Capture:

* operation
* function ID
* model ID
* provider
* metadata
* start time

#### Step start and finish

Map each provider generation step to LLM events.

Capture:

* step number
* model
* provider
* duration
* finish reason
* token usage
* retries when available
* response ID
* error status

#### Tool start and finish

Map to TOOL events.

Capture:

* tool name
* tool call ID
* duration
* success/error
* bounded argument summary when enabled
* bounded result summary when enabled

#### Stream behavior

Capture:

* stream start
* first chunk latency
* finish latency
* total duration
* output token count
* average completion throughput when available
* chunk count only when reliably available

Do not persist every token by default.

### Capture policy

```ts
type CaptureMode =
  | "metadata-only"
  | "preview"
  | "full";
```

Defaults:

```text
metadata-only
recordInputs false
recordOutputs false
no tool arguments/results persisted
```

Preview mode:

* bounded
* redacted
* explicit
* separately configurable for inputs and outputs

### Package boundary

* optional package
* peer dependency on supported AI SDK versions
* no AI SDK dependency in root
* own compatibility matrix
* own package tests
* experimental adapter API during 1.x

---

## v1.7 scope B — `@agent-inspect/openai-agents`

### Integration strategy

Implement a supported trace processor.

### APIs

```ts
import {
  agentInspectTraceProcessor
} from "@agent-inspect/openai-agents";
```

Additional local processor:

```ts
addTraceProcessor(
  agentInspectTraceProcessor()
);
```

Local-only replacement:

```ts
setTraceProcessors([
  agentInspectTraceProcessor()
]);
```

### Documentation requirement

The README must explicitly distinguish:

```text
addTraceProcessor:
AgentInspect receives traces, but the default OpenAI exporter may still run.

setTraceProcessors:
AgentInspect replaces the processor set; traces remain local unless another processor is added.
```

### Span mapping

* agent → AGENT
* generation → LLM
* function/tool → TOOL
* handoff → AGENT or CHAIN relationship
* guardrail → GUARDRAIL
* MCP list tools → TOOL or MCP-specific extension
* custom span → CHAIN or extension kind
* response span → LLM/AGENT based on context
* error → error status and structured error

### Sensitive data

Default:

* exclude sensitive inputs and outputs
* apply AgentInspect redaction after framework capture
* document both framework-level and AgentInspect-level privacy settings

---

## v1.7 scope C — LangGraph through `@agent-inspect/langchain`

Extend the existing package first.

### Add

* graph node identity
* subgraph relationships
* task IDs
* checkpoint metadata
* stream modes
* parent/child graph execution
* parallel branch attribution
* graph retry metadata
* handoff metadata
* session/thread IDs where exposed

### Decision on separate package

Create `@agent-inspect/langgraph` only if:

* the API becomes confusing inside the LangChain package
* LangGraph requires materially different peer dependencies
* users request a separate install
* compatibility maintenance benefits from independent versioning

---

## v1.7 scope D — Adapter conformance preview

All official adapters must emit fixtures covering:

* successful run
* failed run
* tool call
* multiple tool calls
* streaming LLM
* token usage
* parent-child relationships
* parallel operations
* correlation metadata
* redacted input/output
* large result truncation

These fixtures become the foundation of the v1.9 conformance suite.

---

## v1.7 scope E — Starter projects

Publish small runnable recipes:

```text
ai-sdk-generate-text
ai-sdk-stream-text
ai-sdk-tools
ai-sdk-next-route
openai-agents-local-only
openai-agents-additional-processor
langgraph-basic
langgraph-subgraph
langgraph-streaming
```

Each recipe must include:

* install
* one integration point
* run command
* expected trace
* inspection command
* privacy notes
* troubleshooting
* framework-version range

---

## v1.7 implementation chunks

### Chunk 0 — Adapter architecture and compatibility matrix

No runtime code.

### Chunks 1–4 — AI SDK

1. package scaffold and mapping types
2. generation/step lifecycle
3. tools and streaming
4. recipes, compatibility, package smoke

### Chunks 5–7 — OpenAI Agents

1. processor and trace mapping
2. privacy and local-only mode
3. recipes and compatibility

### Chunks 8–9 — LangGraph

1. graph/subgraph/task mapping
2. streaming/checkpoint recipes and tests

### Chunk 10 — Shared adapter tests

Create internal test utilities used by all official adapters.

### Chunk 11 — Release readiness and adoption launch

* docs
* changelog
* package compatibility
* outreach to design partners
* framework-community feedback requests

---

## v1.7 release gate

Engineering gate:

* adapters use official extension points
* no monkey-patching
* no root framework dependencies
* metadata-only defaults
* no network upload
* all events normalize through the v1.6 model
* adapters pass shared fixtures
* streaming does not store token text by default
* ESM/CJS compatibility passes where supported

Adoption gate:

* five unrelated projects try at least one adapter
* three projects retain the adapter for two weeks
* median time from install to first trace is below five minutes
* at least one public integration example exists outside the repo
* adapter users perform more than one trace inspection

Mastra gate:

Do not implement Mastra in v1.7 unless:

* the official extension surface is verified
* two external users request it
* one design partner agrees to validate it

Otherwise schedule Mastra for v2.1.

---

# 10. v1.8.0 — Deterministic Checks, Safe Sharing, and CI Reporters

## Release goal

Turn traces into enforceable engineering artifacts.

This is the release that moves AgentInspect from:

```text
useful local debugger
```

to:

```text
repeatable team workflow
```

---

## v1.8 scope A — `check`

### CLI examples

```bash
agent-inspect check trace.json --require-success

agent-inspect check trace.json \
  --max-duration 5s \
  --max-depth 8 \
  --max-tool-calls 10 \
  --max-llm-calls 5 \
  --max-retries 2

agent-inspect check trace.json \
  --require-tool retrievePolicy \
  --deny-tool deleteAccount

agent-inspect check candidate.json \
  --baseline baseline.json
```

### Initial deterministic rules

#### Run rules

* required success
* allowed statuses
* maximum duration
* maximum event count
* maximum depth
* no incomplete events
* no orphan events

#### Tool rules

* required tools
* forbidden tools
* allowed tool list
* maximum calls per tool
* required ordering
* maximum failures
* maximum retries

#### LLM rules

* allowed models
* allowed providers
* maximum LLM calls
* input token budget
* output token budget
* total token budget
* finish reason restrictions

#### Structure rules

* required span kind
* forbidden span kind
* required parent-child relationship
* maximum parallel width
* required retrieval before generation
* required guardrail before output
* required decision metadata

#### Safety rules

* no unredacted secret patterns
* no full prompts
* no full outputs
* no oversized attributes
* required redaction profile

### Exit codes

```text
0  all checks passed
1  one or more checks failed
2  invalid config or arguments
3  trace could not be read
4  unsupported trace format
```

### Machine-readable result

```ts
interface TraceCheckResult {
  passed: boolean;
  traceId?: string;
  runId?: string;
  results: TraceRuleResult[];
  summary: {
    passed: number;
    failed: number;
    skipped: number;
  };
}
```

Each rule result must include:

* rule ID
* pass/fail
* expected value
* actual value
* event/span evidence
* path or event IDs
* human-readable message

---

## v1.8 scope B — `assertTrace`

### Programmatic API

```ts
import {
  assertTrace
} from "agent-inspect/checks";

const result = await assertTrace(trace, {
  status: "success",
  maxDurationMs: 5000,
  requiredTools: ["retrievePolicy"],
  forbiddenTools: ["deleteAccount"],
  maxRetries: 1
});
```

### Configuration formats

Support:

* JavaScript
* TypeScript
* JSON

Do not add a YAML parser dependency initially.

Possible config:

```ts
export default {
  rules: {
    requireSuccess: true,
    maxDurationMs: 5000,
    requiredTools: ["retrievePolicy"],
    forbiddenTools: ["deleteAccount"],
    maxRetries: 1,
    maxTotalTokens: 8000
  }
};
```

---

## v1.8 scope C — Baseline regression

### Comparison dimensions

* tree shape
* first divergence
* tool additions/removals
* tool-order changes
* LLM additions/removals
* model/provider changes
* token change
* duration change
* retry change
* status change
* error-path change
* retrieval/guardrail changes

### Threshold configuration

```ts
baseline: {
  maxDurationIncreasePercent: 20,
  maxTokenIncreasePercent: 15,
  allowNewTools: false,
  allowRemovedTools: false,
  allowModelChange: false
}
```

Do not treat nondeterministic text-output differences as failures by default.

---

## v1.8 scope D — `@agent-inspect/vitest`

### Goals

* associate test with trace runs explicitly
* generate artifacts only when useful
* avoid timestamp heuristics

### Recommended helper

```ts
import {
  traceTest
} from "@agent-inspect/vitest";

test("refund agent", async (context) => {
  await traceTest(
    context,
    "refund-case",
    async () => runAgent()
  );
});
```

### Reporter output on failure

```text
artifacts/
  refund-agent/
    trace.jsonl
    report.md
    report.html
    check-results.json
    diff.md
```

### Successful tests

Default:

* no HTML report
* no Markdown report
* optionally retain JSONL
* configurable cleanup

---

## v1.8 scope E — `@agent-inspect/jest`

Provide equivalent behavior appropriate to Jest hooks and reporters.

Avoid pretending Vitest and Jest lifecycle APIs are identical. Maintain independent package tests and compatibility matrices.

---

## v1.8 scope F — GitHub Actions

### Initial integration

Use standard workflow capabilities:

* artifact upload
* `$GITHUB_STEP_SUMMARY`
* Markdown report
* check exit codes

Possible command:

```bash
agent-inspect ci-summary \
  --trace ./artifacts/trace.jsonl \
  --output "$GITHUB_STEP_SUMMARY"
```

Do not require:

* a GitHub App
* OAuth
* repository write access
* automatic PR comments

Automatic comments may be added later as explicit opt-in functionality.

---

## v1.8 scope G — Safe-sharing verification

### Commands

```bash
agent-inspect scan trace.json
agent-inspect verify-safe report.html
agent-inspect export trace.json \
  --redaction-profile share
```

### `scan`

Detect likely:

* API keys
* bearer tokens
* authorization headers
* cookies
* private keys
* known provider-key prefixes
* email addresses
* full prompts/outputs based on field paths
* oversized sensitive payloads

### `verify-safe`

Report:

* retained fields
* redacted fields
* hashed fields
* dropped fields
* detected secret patterns
* capture mode
* whether prompts are included
* whether outputs are included
* whether tool arguments/results are included

It should produce:

```text
SAFE
SAFE WITH WARNINGS
UNSAFE
UNKNOWN
```

Do not claim:

* HIPAA compliance
* GDPR compliance
* PCI compliance
* guaranteed PII detection
* compliance certification

---

## v1.8 implementation chunks

1. checks architecture RFC
2. rule engine and result types
3. run/tool/LLM rules
4. structure and safety rules
5. CLI flags and JSON output
6. config-file support
7. baseline regression rules
8. Vitest helper
9. Vitest reporter
10. Jest helper/reporter
11. scan and verify-safe
12. GitHub step summary
13. recipes and CI examples
14. release readiness

---

## v1.8 release gate

Engineering:

* checks work across v0.1, v0.2, OpenInference, OTLP, and framework adapters
* results are deterministic
* every failure includes evidence
* exit codes are documented
* no LLM invocation
* no network calls
* reporters do not hide original test failures
* share-safe profiles apply before artifact generation
* secret scanning is explicitly best-effort

Adoption:

* three unrelated CI workflows retain AgentInspect checks
* five projects run `check` more than once
* users can diagnose a failed check from the generated evidence
* at least one project uses baseline regression in a pull request

---

# 11. v1.9.0 — Sessions, Conformance, and v2 Contract Freeze

## Release goal

Prove the normalized model works across sources and freeze the contracts needed by v2.

---

## v1.9 scope A — Sessions and cross-run causality

### Commands

```bash
agent-inspect sessions
agent-inspect session <session-id>
agent-inspect session <session-id> --timeline
agent-inspect session <session-id> --runs
agent-inspect session <session-id> --errors
agent-inspect search --session <session-id>
agent-inspect search --correlation-id <id>
agent-inspect search --request-id <id>
agent-inspect search --job-id <id>
```

### Relationships

Support:

* session → runs
* workflow → runs
* run → child runs
* handoff → target agent run
* job → attempts
* retry → previous attempt
* conversation → turns
* graph → subgraphs
* parallel branches
* parent group → child groups

### Display

A session view should show:

```text
Session customer-support-123

Turn 1
└─ triage-agent
   ├─ llm:classify-intent
   └─ tool:load-customer

Turn 2
└─ refund-agent
   ├─ tool:retrieve-policy
   ├─ guardrail:refund-limit
   └─ llm:generate-answer
```

Do not infer session relationships from timestamps alone.

---

## v1.9 scope B — Conformance package

### Package

```text
@agent-inspect/conformance
```

### CLI

```bash
npx agent-inspect-conformance \
  ./adapter-output.jsonl
```

### Conformance levels

#### Level 1 — Basic

* valid schema
* run ID
* event ID
* timestamp
* kind
* source
* status

#### Level 2 — Structural

* valid parents
* no cycles
* valid root
* valid duration
* valid start/end pairing
* valid run completion

#### Level 3 — Agent semantics

* LLM metadata
* tool metadata
* retrieval metadata
* token metadata
* streaming metadata
* error representation
* handoff representation

#### Level 4 — Safety

* redaction metadata
* size limits
* capture policy
* secret-scan fixtures
* truncation behavior

#### Level 5 — Compatibility

* unknown attributes
* additive fields
* source version
* semantic-convention version
* legacy compatibility

---

## v1.9 scope C — Canonical fixture suite

Required fixtures:

```text
minimal-success
minimal-error
nested-tools
parallel-tools
streaming-llm
llm-token-usage
retrieval
reranking
embedding
guardrail
retry-success
retry-failure
multi-agent-handoff
session-multi-turn
langgraph-subgraph
mcp-list-tools
mcp-tool-call
redaction-local
redaction-share
redaction-strict
truncated-event
unknown-extension
orphan-parent
invalid-cycle
legacy-v0.1
persisted-v0.2
otlp-json
openinference
```

Every official adapter must produce or match the applicable fixtures.

---

## v1.9 scope D — Adapter author kit

Provide:

```text
docs/ADAPTER-AUTHOR-GUIDE.md
docs/CAPTURE-POLICY.md
docs/SOURCE-METADATA.md
docs/SEMANTIC-MAPPING.md
examples/third-party-adapter
```

API preview:

```ts
interface AgentInspectAdapter {
  readonly name: string;
  readonly version: string;
  readonly source: EventSource;

  attach(
    inspector: Inspector,
    options?: AdapterOptions
  ): AdapterHandle;
}
```

Do not stabilize this interface until external feedback confirms it is sufficient.

---

## v1.9 scope E — Standards hardening

Freeze mappings for:

* AgentInspect kinds
* OpenInference kinds
* OTel GenAI operations
* status
* tokens
* trace/span IDs
* tool arguments/results
* model/provider
* retrieval
* guardrails
* errors
* sessions
* MCP where applicable

Document:

* exact mappings
* lossy mappings
* unsupported attributes
* semantic-convention version
* compatibility policy
* fixture-backed examples

Use careful claims:

```text
OpenInference-compatible
OTel GenAI-aligned
fixture-validated
```

Do not claim universal backend compatibility.

---

## v1.9 scope F — Performance and failure characterization

Benchmark:

* legacy v0.1 direct writer
* v0.2 direct file writer
* buffered writer
* memory writer
* 10 parallel runs
* 100 parallel runs
* deeply nested run
* large trace directory
* large bounded event
* flush under load
* shutdown with pending events
* writer failure
* queue overflow
* reader on large OTLP file
* check engine on large trace

Publish:

* tested Node versions
* operating-system matrix
* approximate overhead
* queue limits
* trace-size guidance
* known limitations

Do not claim production suitability outside tested ranges.

---

## v1.9 scope G — v2 freeze

Finalize:

* schema 1.0 RFC
* small root API
* stable subpaths
* writer API
* reader API
* inspector API
* check API
* exporter API
* reporter API
* correlation/session contract
* token contract
* redaction contract
* capture policy
* migration behavior
* deprecation list
* RC checklist

---

## v1.9 implementation chunks

1. session model RFC
2. session indexing and query helpers
3. session CLI
4. conformance result types
5. schema and structural conformance
6. semantic and safety conformance
7. canonical fixtures
8. adapter author utilities
9. standards mapping validation
10. performance benchmarks
11. v2 schema and API freeze
12. migration preview
13. release readiness

---

## v1.9 release gate

* three official adapters pass conformance
* v0.1 and v0.2 remain readable
* OpenInference and OTLP readers pass fixture validation
* sessions work across at least two trace sources
* no high-risk unresolved schema decision remains
* performance limitations are documented
* v2 migration has been tested in dry-run mode
* two external users review the v2 contract
* one third-party adapter prototype uses the author kit

---

# 12. v2.0.0 — Stable Local Agent Trace Utility

## Release goal

Ship a small, stable, interoperable TypeScript utility contract.

Use release candidates:

```text
2.0.0-rc.1
2.0.0-rc.2
2.0.0
```

Add more RCs when external migration feedback requires them.

---

## v2 root API

Target approximately:

```ts
import {
  createInspector,
  inspectRun,
  maybeInspectRun,
  step,
  observe,
  getCurrentCorrelationMetadata
} from "agent-inspect";
```

Essential stable types may also be exported.

Everything else moves to subpaths.

---

## v2 subpaths

```text
agent-inspect/writers
agent-inspect/readers
agent-inspect/checks
agent-inspect/diff
agent-inspect/exporters
agent-inspect/logs
agent-inspect/adapters
agent-inspect/persisted
agent-inspect/advanced
```

`advanced` remains explicitly less stable than the other documented contracts.

---

## v2 persisted contract

Default writes:

```text
schemaVersion: "1.0"
```

Compatibility:

```text
read v0.1
read v0.2
read v1.0
write v1.0
```

No automatic destructive migration.

### Migration commands

```bash
agent-inspect migrate ./old-traces \
  --to 1.0 \
  --dry-run

agent-inspect migrate ./old-traces \
  --to 1.0 \
  --out ./migrated-traces
```

Migration report:

* source format
* target format
* events converted
* fields preserved
* fields transformed
* fields dropped
* warnings
* output paths

Never overwrite original traces by default.

---

## Stable v2 contracts

* `AgentEvent`
* `Inspector`
* `TraceReader`
* `TraceWriter`
* `TraceReadResult`
* adapter contract
* check rule contract
* reporter contract
* exporter contract
* capture policy
* redaction profile contract
* source metadata
* confidence
* token usage
* correlation metadata
* sessions and groups
* conformance suite

---

## Stable v2 commands

```bash
agent-inspect open
agent-inspect list
agent-inspect view
agent-inspect what
agent-inspect report
agent-inspect timeline
agent-inspect stats
agent-inspect search
agent-inspect diff
agent-inspect check
agent-inspect scan
agent-inspect verify-safe
agent-inspect sessions
agent-inspect session
agent-inspect migrate
agent-inspect export
```

`logs`, `tail`, and log-ingest functionality remain available but positioned as a secondary compatibility path.

---

## v2 supported sources

Stable support:

* AgentInspect v0.1
* AgentInspect v0.2
* AgentInspect v1.0
* OpenInference
* OTLP JSON
* AI SDK adapter
* OpenAI Agents adapter
* LangChain/LangGraph adapter
* structured JSON logs

Conditional stable support:

* Mastra, only when the v2.1 demand gate was satisfied early enough
* MCP, only where semantic mapping is sufficiently mature

---

## v2 release gate

Engineering:

* root API is small and documented
* deprecated root exports have migration guidance
* schema 1.0 passes conformance
* official adapters pass conformance
* old traces remain readable
* migration is non-destructive
* package boundaries pass ESM/CJS tests
* writer failure never affects application semantics
* safety documentation matches behavior
* no default network activity

External adoption:

* 10 unrelated teams have used AgentInspect
* at least 5 remain active after 30 days
* at least 3 real repositories retain it as a dev/test/diagnostic dependency
* at least 3 CI workflows depend on checks or artifacts
* at least 2 meaningful external integrations or recipes exist
* external users test the RC migration
* median time to first useful trace is below five minutes

Do not declare v2 stable only because implementation is complete.

---

# 13. v2.x — Ecosystem Expansion

## v2.1 — Mastra and MCP ecosystem support

### Mastra

Implement only after demand validation.

Use the framework's supported exporter or observability interface.

Capture:

* agents
* workflows
* tools
* model calls
* errors
* tokens
* sessions
* workflow steps

### MCP

Support:

* client connection
* server identity
* tools/list
* tools/call
* tool name
* arguments summary
* result summary
* transport
* duration
* errors
* session ID
* trace context

Separate:

```text
MCP telemetry ingestion
```

from:

```text
AgentInspect read-only MCP server
```

They are different features.

---

## v2.2 — Workflow and session causality

Improve:

* workflow graphs
* session timelines
* handoff navigation
* retry-attempt grouping
* conversation-turn grouping
* branch visualization
* critical-path analysis
* session diff
* cohort comparison
* group-level checks

Possible commands:

```bash
agent-inspect cohort \
  --group-by metadata.promptVersion

agent-inspect cohort \
  --baseline ./before \
  --candidate ./after

agent-inspect session <id> \
  --critical-path
```

---

## v2.3 — Controlled diagnostic runtime

### Modes

```ts
createInspector({
  mode: "diagnostic"
});
```

Supported:

* `off`
* `local`
* `ci`
* `diagnostic`

### Sampling

```ts
sampling: {
  errors: 1,
  slowRuns: {
    thresholdMs: 5000,
    rate: 1
  },
  successfulRuns: 0.01
}
```

### Runtime features

* buffered queue
* bounded queue
* sampling
* slow-run capture
* error-only capture
* flush interval
* shutdown flush
* file rotation
* retention
* dropped-event counters
* configurable overflow behavior
* diagnostic health report
* tested overhead limits

### Non-goal

Do not call this production APM.

The intended use is:

* controlled staging diagnostics
* selectively enabled production reproduction
* low-volume worker diagnostics
* error/slow-run capture

---

## v2.4 — Optional local viewer

Package:

```text
@agent-inspect/viewer
```

Command:

```bash
agent-inspect serve
```

Requirements:

* localhost binding by default
* read-only
* no cloud
* no account
* no root dependency
* source JSONL remains canonical
* optional index is rebuildable
* no database in root

Views:

* execution tree
* waterfall timeline
* critical path
* sessions
* search
* diff
* check results
* safety status
* report export

The TUI should receive maintenance, not an independent major feature program.

---

## v2.5 — Read-only MCP and IDE surfaces

### Read-only MCP package

```text
@agent-inspect/mcp
```

Tools:

* list runs
* read run
* search traces
* find first error
* find slowest path
* compare runs
* run checks
* create share-safe report

Do not expose:

* trace mutation
* unredacted data by default
* automatic code edits
* replay
* tool invocation
* automatic remediation

### IDE decision gate

Consider Cursor or VS Code integration only if developers repeatedly request:

* click from trace to source
* view trace beside code
* run checks from the editor
* compare baseline and candidate beside the PR

Do not build an IDE extension only for visibility.

---

## v2.6 — Explain-provider experiment

Package:

```text
@agent-inspect/explain
```

Workflow:

1. Read trace.
2. Generate deterministic `what` and report.
3. Apply `share` or `strict` redaction.
4. Show exact provider payload.
5. Require provider selection.
6. Invoke provider.
7. label facts separately from inference.

Possible providers:

* Ollama-compatible local endpoint
* explicitly configured OpenAI
* explicitly configured Anthropic
* explicitly configured Gemini

Required output sections:

```text
Trace facts
Likely interpretation
Suggested investigation
Uncertainty
```

No default cloud provider.

No chain-of-thought request.

Stop development when users do not find it materially better than deterministic reports.

---

## v2.7 — Adapter SDK and community registry

Provide:

* stable adapter interfaces
* reusable mapping utilities
* conformance runner
* fixture generators
* compatibility badge
* community adapter index
* supported-framework matrix
* capture/privacy review checklist
* adapter versioning policy
* maintainer responsibilities

The strongest ecosystem success signal is:

> Another library produces AgentInspect-compatible traces without depending on AgentInspect's CLI implementation.

---

# 14. v3.0 — Extensible Agent Trace Toolchain

## Status

Conditional strategic destination.

It is not guaranteed simply because v2 is complete.

## Goal

Turn the stable local utility into an extensible agent-trace toolchain.

## Stable extension contracts

```ts
interface TraceSource {}
interface TraceReader {}
interface TraceWriter {}
interface TraceTransform {}
interface TraceCheck {}
interface TraceRenderer {}
interface TraceIndexer {}
interface TraceAdapter {}
```

## Shared event model

Every surface consumes the same stable schema:

* CLI
* CI reporters
* static reports
* local viewer
* MCP server
* IDE integration
* external adapter tools
* diagnostic runtime

## Stable runtime capabilities

* buffering
* sampling
* backpressure
* rotation
* retention
* crash-safe flushing
* writer extensions
* reader extensions
* source-specific transforms
* documented performance envelopes

## Ecosystem capabilities

* official adapters
* third-party adapters
* conformance certification
* compatibility matrix
* framework starter templates
* community adapter governance
* semantic-extension registry
* migration policy

## Storage model

* JSONL remains a portable durable artifact
* optional indexes are derived
* indexes are rebuildable
* no hosted database is required
* no proprietary cloud protocol is mandatory

## v3 non-goals

* hosted multi-tenant product
* billing
* prompt management
* dataset management
* production alerting platform
* automatic production replay
* universal auto-remediation
* full APM replacement

## v3 release gate

Proceed only when:

* v2 demonstrates retained usage
* several external projects emit compatible traces
* at least one third-party adapter is maintained outside the core repo
* CI checks have recurring use
* users request extensibility rather than more built-in integrations
* the local-first model remains a meaningful advantage

When these signals do not appear, narrow the product to the best-adopted framework and CI workflow rather than building a generic platform.

---

# 15. Cross-cutting implementation rules

## 15.1 Application behavior always wins

Instrumentation must never:

* replace an application error
* change a return value
* block shutdown indefinitely
* cause a framework operation to fail
* silently send network traffic

## 15.2 Privacy defaults

Default capture:

```text
metadata only
```

Full inputs, outputs, prompts, tool arguments, and tool results require explicit configuration.

Redaction happens:

```text
before disk
before export
before remote provider
before optional OTLP transmission
```

## 15.3 Standards are mappings

Core should not depend on:

* an OTel SDK
* a collector
* a vendor SDK
* a hosted backend

AgentInspect may use pure JSON models and optional packages.

## 15.4 Token and cost policy

Token metadata is first-class when supplied.

Cost metadata may be preserved when provided by a framework or user.

AgentInspect will not:

* maintain model pricing tables
* estimate invoice-grade costs
* claim billing accuracy

## 15.5 Log-ingest policy

Structured logs remain supported, but secondary.

Priorities:

```text
native framework events
standard traces
manual AgentInspect traces
structured logs
```

Do not keep expanding arbitrary text-log parsers.

## 15.6 Dependency policy

Root runtime dependencies should remain limited.

Optional ecosystem packages own their peer dependencies.

No framework dependency enters root/core.

## 15.7 API policy

During 1.x:

* additive APIs
* deprecations
* no broad root removal

At v2:

* root API reset
* explicit migration guide
* documented subpaths
* stable contracts

## 15.8 Release-train policy

* one commit-sized Cursor chunk at a time
* maintainer review after each chunk
* fewer npm releases
* no automatic version bump
* no publish from implementation prompts
* explicit release-readiness pass
* post-release npm/package verification

---

# 16. Validation matrix

## Documentation-only

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Fixtures and recipes

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
pnpm recipes:check
```

## Core runtime

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm pack:smoke
```

## Package/export changes

```bash
pnpm compat:smoke
npm pack --dry-run
```

## Performance/runtime changes

```bash
pnpm perf:baseline
```

Add focused runtime benchmarks for:

* writer throughput
* flush time
* queue overflow
* parallel traces
* large file reading
* check performance

## Release readiness

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm size
pnpm test:all
pnpm pack:smoke
pnpm compat:smoke
pnpm perf:baseline
npm pack --dry-run
```

Package-specific adapters must run their own test suites and clean-install smoke tests.

---

# 17. Adoption and product-validation program

## Design partners

Recruit 5–10 unrelated teams across:

* AI SDK
* OpenAI Agents
* LangGraph
* mature hosted-observability project
* privacy-sensitive project
* CI/eval-heavy project
* NestJS or monorepo project
* agent framework maintainer

## Activation metrics

Measure manually and through opt-in research:

* install → first trace opened
* first trace → first useful command
* time to first useful trace
* number of adapter setup steps
* quickstart completion

Target:

```text
median time to first useful trace < 5 minutes
```

## Retention metrics

* active after 7 days
* active after 30 days
* repeat runs inspected
* repeat `diff` usage
* repeat `check` usage
* adapter retained in package manifest
* reporter retained in CI

## Workflow metrics

* CI trace artifacts created
* CI checks executed
* baseline comparisons
* reports generated
* safety scans run
* framework adapter usage
* sessions inspected

## Community signals

* external compatibility bugs
* meaningful adapter requests
* external recipes
* external adapter implementations
* framework documentation references
* users asking for deeper workflows rather than installation help

## Privacy-respecting measurement

Do not add hidden telemetry.

Use:

* package-specific npm trends
* public GitHub dependents
* public code search
* design-partner interviews
* opt-in surveys
* case studies
* optional local usage report

Possible command:

```bash
agent-inspect usage-report \
  --output usage-report.json
```

It must never transmit automatically.

---

# 18. Product gates

## After v1.6

Expected:

* two external `open` users
* one custom-inspector user
* external OpenInference or OTLP trace successfully inspected
* no regression in legacy trace workflows

## After v1.7

Expected:

* five unrelated adapter trials
* three retained integrations
* median first trace below five minutes
* one external public integration example

## After v1.8

Expected:

* three retained CI workflows
* repeated `check` use
* one baseline-regression workflow
* users request more assertion types rather than basic setup help

## Before v2 stable

Expected:

* 10 unrelated teams
* five retained for 30 days
* three real repositories retaining the package
* three CI workflows depending on checks/artifacts
* two external integrations or major recipes
* external RC migration validation

## Eight-to-twelve-week gate

Eight to twelve weeks after adapters and CI checks ship:

* broaden only when recurring usage grows
* prioritize the best-adopted adapter
* stop low-demand integrations
* narrow product scope when evidence is weak
* do not respond to weak adoption by creating a hosted dashboard

---

# 19. Immediate implementation order

The next work should proceed in this exact order.

## Step 1 — Documentation reset

Commit:

```text
docs: align canonical roadmap after v1.5.0
```

## Step 2 — v1.6 architecture RFCs

Commit:

```text
docs: define inspector reader and writer contracts
```

## Step 3 — Memory and null writers

Commit:

```text
feat: add experimental trace writer contract
```

## Step 4 — Direct file writer

Commit:

```text
feat: add normalized file trace writer
```

## Step 5 — Buffered and composite writers

Commit:

```text
feat: add buffered and composite trace writers
```

## Step 6 — Instance-scoped runtime

Commit:

```text
feat: add experimental inspector runtime
```

## Step 7 — `createInspector`

Commit:

```text
feat: add experimental createInspector API
```

## Step 8 — Reader abstraction

Commit:

```text
feat: add trace reader contract
```

## Step 9 — Consolidate v0.1/v0.2 readers

Commit:

```text
refactor: unify AgentInspect trace readers
```

## Step 10 — OpenInference reader

Commit:

```text
feat: ingest OpenInference traces locally
```

## Step 11 — OTLP JSON reader

Commit:

```text
feat: ingest OTLP JSON traces locally
```

## Step 12 — Universal `open`

Commit:

```text
feat: add universal trace open command
```

## Step 13 — Inspection-command migration

Commit:

```text
refactor: use canonical reader across inspection commands
```

## Step 14 — Recipes and readiness

Commit:

```text
docs: add universal ingestion and writer recipes
```

Only after v1.6 is published and verified should implementation begin on `@agent-inspect/ai-sdk`.

---

# 20. Final priority order

## Build now

1. Canonical roadmap cleanup
2. `TraceWriter`
3. `createInspector`
4. `TraceReader`
5. OpenInference ingestion
6. OTLP JSON ingestion
7. universal `open`
8. AI SDK integration
9. OpenAI Agents processor
10. LangGraph improvements
11. deterministic `check`
12. Vitest/Jest reporters
13. safe-sharing verification
14. sessions
15. conformance suite
16. v2 contract

## Build after demonstrated demand

* Mastra
* MCP telemetry
* controlled diagnostic mode
* local web viewer
* read-only MCP server
* IDE extension
* explain provider
* adapter registry

## Deprioritize

* new report formats
* major TUI investment
* additional text-log formats
* decorators
* provider cost calculations
* vendor-specific exporters
* replay

## Avoid

* hosted dashboard
* prompt registry
* dataset platform
* billing platform
* default cloud telemetry
* production alerting
* automatic remediation
* universal monkey-patching
* competing proprietary telemetry standard
