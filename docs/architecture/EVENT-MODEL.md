# Event Model

## Purpose

The AgentInspect event model is the shared schema foundation for v0.3 and beyond.

Every input source should normalize into this model:

- manual `inspectRun()` and `step()` traces
- JSON logs
- log4js logs
- future pino/winston logs
- framework callbacks
- future standards-aligned spans

The purpose of the event model is to provide one consistent contract for:

- redaction
- tree building
- CLI rendering
- JSON output
- live tail
- export
- diff and compare
- future adapters

## Design goals

The model should be:

- simple enough for local debugging
- expressive enough for agent workflows
- compatible with future OpenInference and OTel GenAI export
- safe for partial or imperfect log data
- honest about inferred relationships
- stable enough to become a v1.0 contract

## InspectKind

`InspectKind` describes the type of event.

```ts
export type InspectKind =
  | "RUN"
  | "AGENT"
  | "LLM"
  | "TOOL"
  | "CHAIN"
  | "RETRIEVER"
  | "DECISION"
  | "RESULT"
  | "ERROR"
  | "LOGIC"
  | "LOG";
Kind meanings
RUN

A top-level agent execution or job.

Examples:

hotel-booking-run
proactive.job.started
support-agent-eval
AGENT

An agent action, sub-agent execution, or agent lifecycle event.

Examples:

agent:started
agent:decision
coordinator-agent
hotel-agent
LLM

An LLM or chat model call.

Examples:

llm:generate_message
llm:gpt-4-call
chat-model:invoke
TOOL

A tool invocation.

Examples:

tool:searchHotels
tool:get_conversation_history
tool:lookupUser
CHAIN

A chain, workflow segment, or composed operation.

Examples:

LangChain chain
RAG chain
summarization chain
RETRIEVER

A retrieval operation.

Examples:

vector search
document retrieval
memory retrieval
DECISION

A decision point inside the agent.

Examples:

should notify user
choose tool
select next step
decide fallback
RESULT

A final result or output event.

Examples:

notification created
itinerary generated
answer returned
ERROR

An error event.

Examples:

tool failed
LLM call failed
agent execution failed
LOGIC

A normal application logic step.

Examples:

parse response
validate input
transform data
LOG

A generic log event that does not map cleanly to a more specific kind.

Use this as a safe fallback.

AttributionConfidence

AttributionConfidence describes how confident AgentInspect is about a relationship or grouping.

export type AttributionConfidence =
  | "explicit"
  | "correlated"
  | "heuristic"
  | "unknown";
Confidence meanings
explicit

The relationship is directly provided by the source.

Examples:

manual step() context
parentId exists in the event
spanId / parentSpanId exists
LangChain callback provides parentRunId

This is the highest-confidence relationship.

correlated

The event belongs to a run because it shares a correlation key, but exact parent-child structure is not known.

Examples:

same decisionId
same requestId
same jobId
same runId

Correlated events should usually appear as siblings in a flat grouped timeline unless another explicit parent exists.

heuristic

The relationship is inferred from patterns, names, or safe start/end pairing.

Examples:

start/end event pairing with same event name and same run ID
explicit config mapping that describes event lifecycle
event naming convention strongly indicates a pair

Heuristic relationships must be shown honestly. Do not hide that the relationship is inferred.

unknown

AgentInspect cannot confidently group or relate the event.

Examples:

no run ID
ambiguous parent
incomplete log line
missing timestamp and no reliable ordering

Unknown should not be converted into success or certainty.

EventSource

EventSource preserves where an event came from.

export interface EventSource {
  type: "manual" | "json-log" | "log4js" | "pino" | "winston" | "adapter";
  file?: string;
  line?: number;
}
Source types
manual

Created by AgentInspect APIs such as inspectRun() or step().

json-log

Parsed from line-delimited JSON logs.

log4js

Parsed from log4js-style text logs with embedded valid JSON payloads.

pino

Reserved for future pino-style JSON logs.

winston

Reserved for future winston-style JSON logs.

adapter

Created by a framework adapter such as LangChain.

InspectEvent

InspectEvent is the normalized event format.

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
Field definitions
eventId

A unique ID for this event.

Rules:

If the source provides a stable event ID, preserve it.
If not, generate one.
Use nanoid for generated IDs.
Do not use uuid unless explicitly approved.
runId

The ID of the run this event belongs to.

Possible sources:

manual run ID
runId
decisionId
requestId
jobId
adapter-provided run ID

For logs, the run ID should come from the first matching key in runIdKeys.

parentId

Optional parent event ID.

Rules:

Set only when explicit or config-declared.
Do not set parent ID based only on timestamp proximity.
If parent is unknown, leave it undefined.
Do not fake hierarchy.
name

Human-readable event name.

Examples:

job:started
agent:started
tool:get_conversation_history
llm:generate_message
result:notification

Names may come from:

manual step name
log event mapping
raw event name
adapter callback metadata
kind

The event type.

Use the most specific kind available.

If uncertain, use LOG.

timestamp

Unix timestamp in milliseconds.

Rules:

Prefer explicit timestamp field from source.
If log4js prefix contains a timestamp and payload does not, parser may use prefix timestamp.
If no timestamp exists, the normalizer may use ingestion time only if documented.
Do not pretend ingestion time is source time.
status

Optional event status.

Allowed values:

"running" | "ok" | "error"

Rules:

Use error when event clearly represents failure.
Use ok when completion status is explicit.
Use running when a start event has no paired completion yet.
Leave undefined when unknown.
Do not default unknown to success.
durationMs

Optional duration in milliseconds.

Rules:

Use only when explicit or safely paired.
Accept explicit durationMs from logs.
Accept safe start/end pairing only when event names and IDs clearly match.
Do not infer duration from the next unrelated log timestamp.
attributes

Additional metadata.

Examples:

{
  model: "gpt-4o",
  tokens: {
    input: 1200,
    output: 356
  },
  messageCount: 19,
  tripUuid: "89e28415..."
}

Rules:

Exclude fields already mapped to top-level event fields.
Redact sensitive data before terminal display.
Avoid full prompt/output capture by default.
confidence

Confidence in attribution or relationship.

Rules:

Manual events are usually explicit.
Events grouped by run ID are usually correlated.
Events inferred by mapping or safe pairing may be heuristic.
Ambiguous events should be unknown.
source

Where the event came from.

Must preserve parser or adapter type.

InspectNode

InspectNode is the tree representation of an event.

export interface InspectNode {
  event: InspectEvent;
  children: InspectNode[];
  depth: number;
}
Field definitions
event

The normalized event.

children

Child nodes.

Rules:

Children should exist only when the relationship is explicit or config-declared.
For log-derived data, most events should appear as flat siblings by default.
depth

Tree depth for rendering.

Rules:

Root-level run children usually have depth 0 or 1, depending on renderer design.
Depth should be derived from tree structure, not from raw logs.
InspectRunTree

InspectRunTree is the grouped execution view for a run.

export interface InspectRunTree {
  runId: string;
  name?: string;
  status?: "running" | "ok" | "error";
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  children: InspectNode[];
  metadata: {
    totalEvents: number;
    confidenceBreakdown: Record<AttributionConfidence, number>;
    kinds: Record<InspectKind, number>;
  };
}
Field definitions
runId

The run ID shared by the events.

name

Optional run name.

Possible sources:

manual inspectRun() name
RUN event name
config mapping
first event name fallback
status

Overall run status.

Rules:

error if any critical event failed or run completion says error.
ok only when completion is explicit.
running when active or incomplete.
Leave undefined when unknown.

Do not default unknown status to success.

startedAt

Timestamp of first event or explicit run start.

endedAt

Timestamp of explicit run end or last safely completed event.

durationMs

Run duration.

Rules:

Use explicit run duration if available.
Use endedAt - startedAt only when both are trustworthy.
Leave undefined if timing is incomplete.
children

Top-level nodes.

For log-derived runs, this should usually be a flat grouped timeline.

metadata

Summary information useful for rendering, debugging, and filtering.

Example:

metadata: {
  totalEvents: 6,
  confidenceBreakdown: {
    explicit: 1,
    correlated: 5,
    heuristic: 0,
    unknown: 0
  },
  kinds: {
    RUN: 1,
    AGENT: 1,
    TOOL: 1,
    LLM: 2,
    RESULT: 1,
    ERROR: 0,
    CHAIN: 0,
    RETRIEVER: 0,
    DECISION: 0,
    LOGIC: 0,
    LOG: 0
  }
}
Example normalized events
Manual step event
const event: InspectEvent = {
  eventId: "step_abc123",
  runId: "run_abc123",
  parentId: "run_abc123",
  name: "tool:searchHotels",
  kind: "TOOL",
  timestamp: 1746451225624,
  status: "ok",
  durationMs: 2300,
  attributes: {
    city: "Tokyo",
    resultCount: 12
  },
  confidence: "explicit",
  source: {
    type: "manual"
  }
};
JSON log event
const event: InspectEvent = {
  eventId: "evt_abc123",
  runId: "01fe6bf1",
  name: "tool:get_conversation_history",
  kind: "TOOL",
  timestamp: 1746451225624,
  status: "ok",
  attributes: {
    tripUuid: "89e28415",
    messageCount: 19
  },
  confidence: "correlated",
  source: {
    type: "json-log",
    file: "sample-json.log",
    line: 3
  }
};
log4js event
const event: InspectEvent = {
  eventId: "evt_def456",
  runId: "01fe6bf1",
  name: "agent:started",
  kind: "AGENT",
  timestamp: 1746451218132,
  attributes: {
    trips: 1
  },
  confidence: "correlated",
  source: {
    type: "log4js",
    file: "sample-log4js.log",
    line: 2
  }
};
Compatibility with future standards

The event model should remain compatible with future export to OpenInference and OTel GenAI.

Example mapping:

InspectKind.LLM -> openinference.span.kind = "LLM"
InspectKind.TOOL -> openinference.span.kind = "TOOL"
InspectKind.AGENT -> openinference.span.kind = "AGENT"
InspectKind.RETRIEVER -> openinference.span.kind = "RETRIEVER"

Do not make standards export the main model. AgentInspect's model should serve local debugging first, then map outward.

Stability notes

Before v1.0:

Fields may evolve.
New optional fields may be added.
Existing v0.1 traces must remain readable.
Breaking changes should be avoided unless necessary.

At v1.0:

Public event contracts should be stable.
Schema changes should be versioned.
Additive changes should be preferred.