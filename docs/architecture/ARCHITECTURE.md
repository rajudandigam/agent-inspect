# AgentInspect Architecture

## Purpose

AgentInspect is a local-first execution-tree debugging tool for TypeScript AI systems.

Its architecture is designed around one core idea:

> Developers should be able to understand what an AI agent did step by step using manual traces, structured logs, and framework callbacks, without requiring a SaaS account, hosted dashboard, vendor backend, or production observability platform.

AgentInspect starts with local files, terminal output, and trustworthy execution trees. Future integrations such as framework adapters and standards-aligned exports should build on top of the same internal model rather than creating separate systems.

## Product boundary

AgentInspect is:

- a local execution-tree inspector
- a structured log-to-tree tool
- a manual trace tool
- a JSONL trace store
- a terminal-native debugging aid
- a future adapter surface
- a bridgeable local trace format

AgentInspect is not:

- a SaaS product
- a production observability platform
- a web dashboard
- an agent framework
- a generic logging library
- a replay engine
- a cost/pricing engine
- a vendor-specific SDK

## Canonical architecture flow

All input sources should eventually flow through the same architecture:

```text
Input source
  ↓
Parser / adapter / manual API
  ↓
Raw event
  ↓
Normalizer
  ↓
InspectEvent
  ↓
Redactor
  ↓
Tree builder
  ↓
InspectRunTree
  ↓
Renderer / JSON / export / tail / diff

Input sources

AgentInspect supports or plans to support several input sources.

Manual traces

Manual tracing is the v0.1 foundation.

import { inspectRun, step, observe } from "agent-inspect";

await inspectRun("trip-planner", async () => {
  const plan = await step("plan", async () => planner.run());
  const hotels = await step.tool("searchHotels", async () => searchHotels(plan));
  return step("finalize", async () => finalize(plan, hotels));
});

Manual traces are expected to have the highest confidence because AgentInspect controls the run and step boundaries directly.

Structured logs

Structured logs are the core post-MVP wedge.

The v0.3 direction is to parse logs that developers already have and turn them into local execution trees or grouped timelines.

Supported priority:

Line-delimited JSON logs
log4js-style text logs with embedded valid JSON payloads
Future pino/winston-style JSON logs
Future framework or custom logger recipes

JSON logs are first-class.

Text logs are best-effort.

AgentInspect must not parse unsafe JavaScript object strings, must not use eval, and must not silently invent missing structure.

Framework callbacks

Framework adapters should come after the log-to-tree workflow proves useful.

The first planned adapter is LangChain.js, using official callback APIs. Adapter-generated events can provide better parent-child attribution than logs because callbacks usually include run IDs and parent run IDs.

Adapters should normalize into the same InspectEvent model used by manual traces and logs.

Standards and export formats

OpenInference and OpenTelemetry GenAI alignment are important for future interoperability, but they should not drive the first local debugging workflow.

Standards export should be built after the local model is stable.

Use careful language:

OpenInference-compatible
OTel GenAI-aligned
OTLP JSON experimental until verified
Tested against specific targets only when actually tested

Avoid broad claims like:

Works with every OTel backend
Guaranteed Langfuse/Braintrust/New Relic support
Core internal model

All inputs should normalize into an InspectEvent.

export interface InspectEvent {
  eventId: string;
  runId: string;
  parentId?: string;
  name: string;
  kind: InspectKind;
  timestamp: number;
  status?: "running" | "ok" | "error";
  durationMs?: number;
  attributes?: Record<string, unknown>;
  confidence: AttributionConfidence;
  source: EventSource;
}

The event model is the shared contract between:

manual tracing
log ingestion
framework adapters
redaction
tree building
rendering
exporting
diffing
live tailing
Main components
1. Manual API

Responsible for developer-facing APIs:

inspectRun()
step()
step.llm()
step.tool()
observe()

Manual APIs create trace events directly and write them to local JSONL storage.

2. Parsers

Parsers convert external input into raw parsed events.

Examples:

JSON log parser
log4js parser
future pino parser
future winston parser

Parsers should preserve source information such as file path and line number.

Parser responsibility is limited to reading and parsing input. Parsers should not decide final tree structure.

3. Normalizer

The normalizer converts raw parsed data into InspectEvent.

Responsibilities:

extract run ID
extract event name
assign event kind
assign status
extract timestamp
extract duration only when explicit
extract parent ID only when explicit
copy remaining fields into attributes
set confidence
preserve source type

The normalizer should be conservative. If required fields are missing, it should skip the event or mark it as unknown rather than pretending the data is complete.

4. Redactor

The redactor protects terminal output and optional persisted output from secrets.

Responsibilities:

redact default sensitive keys
apply custom redaction rules
partially mask IDs when needed
avoid exposing tokens, cookies, passwords, API keys, or emails in terminal output
avoid mutating source data unexpectedly unless persisted redaction is explicitly enabled

Redaction is required for log ingestion because logs often contain production-like data.

5. Tree builder

The tree builder groups normalized events into an InspectRunTree.

Responsibilities:

group events by runId
sort events by timestamp when appropriate
build a flat timeline by default
nest only when explicit parent information exists
compute metadata
preserve confidence
never silently invent parent-child relationships

The tree builder is intentionally conservative. Trust is more important than clever nesting.

6. Renderers

Renderers convert run trees into human-readable or machine-readable output.

Planned renderers:

CLI tree renderer
JSON renderer
summary renderer
Markdown renderer
HTML renderer
future TUI renderer

Renderers should not change the event model or infer structure. They should display the existing model honestly.

7. Storage

AgentInspect uses local storage by default.

The current storage foundation is JSONL trace files.

Storage principles:

local-first
no account required
no SaaS required
no cloud ingestion required
existing v0.1 traces should remain readable
future schema changes should be versioned
8. Exporters

Exporters transform InspectRunTree into other formats.

Planned formats:

OpenInference-compatible JSON
OTLP JSON
Markdown
HTML

Exporters should be read-only transformations. They should not become production vendor sinks before v1.0.

9. Diff engine

The diff engine compares two run trees.

Planned comparison dimensions:

structure
event names
statuses
attributes
outputs
errors
durations
first divergence

The diff engine should help with eval debugging and regression analysis without executing replay.

10. Live tail

Live tail reads logs from stdin or a file and incrementally renders active run trees.

It should reuse the same parser, normalizer, redactor, and tree builder from log ingestion. It should not duplicate parsing logic.

High-level module direction

Possible future module organization:

packages/core/src/
  inspect-run.ts
  step.ts
  observe.ts
  storage.ts
  types.ts

  types/
    inspect-event.ts
    log-config.ts

  parsers/
    json-log-parser.ts
    log4js-parser.ts

  normalizers/
    event-normalizer.ts

  tree/
    tree-builder.ts
    tree-summary.ts

  redaction/
    redactor.ts

  renderers/
    tree-renderer.ts
    json-renderer.ts

  export/
    markdown-exporter.ts
    openinference-exporter.ts
    otlp-json-exporter.ts

The actual structure should follow the existing repo conventions. Cursor must inspect the current source before creating or moving files.

Architecture principles
Local-first

The default workflow must work locally with no account, no hosted service, and no vendor API key.

Shared model

Manual traces, logs, adapters, and exports must converge on the same InspectEvent and InspectRunTree model.

Conservative tree building

Do not over-nest logs. Flat grouped timelines are better than misleading trees.

Honest confidence

Every relationship that is not explicit must show its confidence.

Safe by default

No full prompt/output capture by default. Redact sensitive fields. Treat trace files as potentially sensitive.

Lean core

Do not add heavy dependencies to the main package without explicit approval.

Terminal first

The primary interface is CLI. TUI and HTML export are optional layers, not the foundation.

Version alignment
v0.2

Improve local trace inspection:

list filtering
view improvements
summary stats
custom trace directory
clean command
v0.3

Validate and implement log-to-tree:

JSON logs first-class
log4js best-effort
config mapping
redaction
confidence labels
flat timeline by default
v0.4

Live tail:

stdin stream
file tail
incremental rendering
active run grouping
v0.5

LangChain adapter:

callback-based instrumentation
explicit parent attribution
metadata-only capture by default
v0.6

Optional TUI:

separate package
no TUI dependency in main package
v0.7

Standards export:

OpenInference-compatible export
OTLP JSON
Markdown
HTML
v0.8

Diff and compare:

first divergence
eval debugging
regression analysis
v0.9

Recipes and hardening:

runnable recipes
fixture catalog
conformance basics
docs cleanup
v1.0

Stable local inspector:

stable APIs
stable schema
stable CLI
strong docs
cross-platform confidence
Non-goals

AgentInspect should not add these before the local debugging workflow is proven:

web dashboard
SaaS backend
production vendor sinks
automatic universal instrumentation
replay/fork execution
cost/pricing engine
generic log aggregation
agent orchestration