# Log Ingest Config

## Purpose

The log ingest config tells AgentInspect how to parse existing structured logs and normalize them into `InspectEvent`.

This is central to the v0.3 log-to-tree workflow.

The config should make it possible to point AgentInspect at logs developers already have and render a useful local execution tree or grouped timeline.

## Design goals

The config should be:

- JSON-compatible
- safe to load
- easy to understand
- explicit about run ID fields
- explicit about event name fields
- conservative about parent-child inference
- compatible with redaction
- flexible enough for different loggers
- simple enough for local debugging

## Important safety rule

The config must not contain executable code.

Do not support function strings.

Do not use `eval`.

Do not parse JavaScript object strings.

Only parse JSON config and valid JSON payloads.

## TypeScript interface

```ts
export interface LogIngestConfig {
  runIdKeys: string[];
  eventKey: string;
  timestampKey?: string;
  messageKey?: string;
  levelKey?: string;
  parentIdKey?: string;
  durationKey?: string;
  statusKey?: string;
  mappings?: Record<string, LogEventMapping>;
  redact?: RedactionRule[];
  heuristicWindowMs?: number;
}
Supporting types
export interface LogEventMapping {
  kind?: InspectKind;
  name?: string;
  parent?: string;
  status?: "running" | "ok" | "error";
  startsRun?: boolean;
  endsRun?: boolean;
  startsStep?: boolean;
  endsStep?: boolean;
}
export type RedactionStrategy = "full" | "prefix" | "hash";

export type RedactionRule =
  | string
  | {
      key: string;
      strategy: RedactionStrategy;
      keep?: number;
    };
Field definitions
runIdKeys

Required.

A list of keys AgentInspect should try when extracting the run ID.

Example:

{
  "runIdKeys": ["decisionId", "requestId", "jobId"]
}

Rules:

Use the first key that exists and has a value.
The extracted value becomes InspectEvent.runId.
If no run ID is found, the event should usually be skipped or marked unknown depending on parser mode.
Do not invent a run ID unless the user explicitly enables such behavior in a future version.

Recommended common keys:

runId
decisionId
requestId
jobId
traceId
correlationId
conversationId
eventKey

Required.

The key containing the event name or event type.

Example:

{
  "eventKey": "event"
}

Example log line:

{"event":"proactive.agent.started","decisionId":"01fe6bf1","timestamp":1746451218132}

The event name is used for:

mapping kind
mapping display name
detecting errors
pairing start/end events when safe
rendering output
timestampKey

Optional.

The key containing the timestamp.

Example:

{
  "timestampKey": "timestamp"
}

Rules:

Prefer millisecond Unix timestamps.
ISO strings may be supported if implemented.
For log4js text logs, parser may use prefix timestamp if payload timestamp is missing.
If timestamp is missing, AgentInspect may use ingestion order for display but should not pretend it is source time.

Default candidate:

timestamp
messageKey

Optional.

The key containing the human-readable log message.

Example:

{
  "messageKey": "message"
}

This may be used for display or fallback naming.

levelKey

Optional.

The key containing the log level.

Example:

{
  "levelKey": "level"
}

Common values:

debug
info
warn
error
fatal

The level may help determine status, but should not override explicit event mappings.

parentIdKey

Optional.

The key containing an explicit parent event ID or span ID.

Example:

{
  "parentIdKey": "parentId"
}

Rules:

If present and parent exists, tree builder may nest.
Parent-child relationships from this key are explicit.
Do not use timestamp proximity as a substitute for this field.
durationKey

Optional.

The key containing explicit duration.

Example:

{
  "durationKey": "durationMs"
}

Rules:

Use this value for InspectEvent.durationMs.
The value should be milliseconds.
If another unit is used, config-level unit support may be added later.
Do not infer duration from neighboring events unless safe pairing is implemented.
statusKey

Optional.

The key containing status.

Example:

{
  "statusKey": "status"
}

Allowed normalized values:

running
ok
error

Possible raw values that may map to normalized status:

success -> ok
completed -> ok
failed -> error
error -> error
running -> running
started -> running

Do not default missing status to success.

mappings

Optional.

A mapping from event names or wildcard patterns to classification rules.

Example:

{
  "mappings": {
    "proactive.job.started": {
      "kind": "RUN",
      "name": "job:started",
      "startsRun": true
    },
    "proactive.tool.*": {
      "kind": "TOOL"
    }
  }
}

Mappings can define:

event kind
display name
parent relationship
status
lifecycle meaning
Exact match
{
  "proactive.agent.started": {
    "kind": "AGENT",
    "name": "agent:started"
  }
}
Wildcard match
{
  "proactive.tool.*": {
    "kind": "TOOL"
  }
}

Wildcard matching should be simple and predictable.

Suggested behavior:

exact matches take priority
then wildcard matches
if multiple wildcards match, use the most specific pattern
if no mapping matches, fallback to LOG kind
redact

Optional.

Redaction rules applied to attributes before display or persistence, depending on mode.

Example:

{
  "redact": [
    "authorization",
    "cookie",
    "token",
    "apiKey",
    "password",
    "secret",
    "email",
    {
      "key": "userUuid",
      "strategy": "prefix",
      "keep": 8
    }
  ]
}

Rules:

String rules mean full redaction by key.
Object rules define a named strategy.
Function strings are not allowed.
Regex strings should not be introduced unless carefully designed later.
heuristicWindowMs

Optional.

A time window for future heuristic logic.

Example:

{
  "heuristicWindowMs": 2000
}

Important:

This does not mean AgentInspect should nest events by timestamp.
It may be used for safe start/end pairing only when event names and run IDs clearly match.
Any heuristic inference must be labeled as heuristic.
Proactive-agent config example

Use this as the canonical v0.3 example config.

{
  "runIdKeys": ["decisionId", "requestId", "jobId"],
  "eventKey": "event",
  "timestampKey": "timestamp",
  "messageKey": "message",
  "levelKey": "level",
  "mappings": {
    "proactive.job.started": {
      "kind": "RUN",
      "name": "job:started",
      "startsRun": true
    },
    "proactive.agent.started": {
      "kind": "AGENT",
      "name": "agent:started"
    },
    "proactive.tool.conversation_history_fetched": {
      "kind": "TOOL",
      "name": "tool:get_conversation_history"
    },
    "proactive.tool.*": {
      "kind": "TOOL"
    },
    "proactive.llm.*": {
      "kind": "LLM"
    },
    "proactive.agent.decision": {
      "kind": "DECISION",
      "name": "agent:decision"
    },
    "proactive.result.*": {
      "kind": "RESULT"
    },
    "*.failed": {
      "kind": "ERROR",
      "status": "error"
    },
    "*.error": {
      "kind": "ERROR",
      "status": "error"
    }
  },
  "redact": [
    "authorization",
    "cookie",
    "token",
    "apiKey",
    "password",
    "secret",
    "email",
    {
      "key": "userUuid",
      "strategy": "prefix",
      "keep": 8
    }
  ],
  "heuristicWindowMs": 2000
}
Example JSON log input
{"event":"proactive.job.started","jobId":"7a06467f","userUuid":"f0769fd4-1234","decisionId":"01fe6bf1","timestamp":1746451218130}
{"event":"proactive.agent.started","trips":1,"decisionId":"01fe6bf1","timestamp":1746451218132}
{"event":"proactive.tool.conversation_history_fetched","tripUuid":"89e28415","messageCount":19,"decisionId":"01fe6bf1","timestamp":1746451225624}
{"event":"proactive.llm.generate_message","model":"gemini-3.1-pro-preview","decisionId":"01fe6bf1","timestamp":1746451227831}
{"event":"proactive.llm.generate_message_completed","tokens":{"input":1200,"output":356},"decisionId":"01fe6bf1","timestamp":1746451229875,"durationMs":2044}
{"event":"proactive.result.notification","shouldNotify":true,"variant":"destination_content","decisionId":"01fe6bf1","timestamp":1746451230012}
Example log4js input
2026-05-05 12:20:18.130 [INFO] [default] - Job started {"event":"proactive.job.started","jobId":"7a06467f","decisionId":"01fe6bf1","timestamp":1746451218130}
2026-05-05 12:20:18.132 [INFO] [default] - Agent started {"event":"proactive.agent.started","trips":1,"decisionId":"01fe6bf1","timestamp":1746451218132}
2026-05-05 12:20:25.624 [INFO] [default] - Tool called {"event":"proactive.tool.conversation_history_fetched","tripUuid":"89e28415","messageCount":19,"decisionId":"01fe6bf1","timestamp":1746451225624}

Rules for log4js:

Extract embedded valid JSON payload only.
Skip lines without valid JSON.
Do not parse JavaScript object strings.
Do not evaluate text.
Preserve source type as log4js.
Expected output shape
Run decision=01fe6bf1
├─ job:started job=7a06467f user=f0769fd4…
│  confidence: explicit
├─ agent:started trips=1
│  confidence: correlated (same decisionId)
├─ tool:get_conversation_history trip=89e28415… msgs=19
│  confidence: correlated (same decisionId)
├─ llm:generate_message model=gemini-3.1-pro-preview ✔ 2.04s
│  confidence: correlated (same decisionId + paired events)
└─ result:notification shouldNotify=true variant=destination_content
   confidence: correlated (same decisionId)

Summary:
  Events: 6
  Tools: 1
  LLMs: 1
  Confidence: 5 correlated, 1 explicit

Note:
  Flat timeline by default. Nesting only with explicit parentId.
Mapping behavior
Kind mapping

If mapping specifies kind:

{
  "proactive.tool.*": {
    "kind": "TOOL"
  }
}

Then normalized event should use:

kind: "TOOL"

If no mapping matches, fallback to:

kind: "LOG"
Name mapping

If mapping specifies name:

{
  "proactive.agent.started": {
    "name": "agent:started"
  }
}

Then normalized event should use that name.

If mapping does not specify name, derive a readable name from event string.

Example:

proactive.llm.generate_message -> llm:generate_message
proactive.tool.search_hotels -> tool:search_hotels
Status mapping

If mapping specifies status:

{
  "*.failed": {
    "kind": "ERROR",
    "status": "error"
  }
}

Then normalized event should use:

status: "error"

Status should also be error when log level or raw event clearly indicates failure.

Parent mapping

If mapping specifies parent:

{
  "proactive.tool.search": {
    "kind": "TOOL",
    "parent": "agent:started"
  }
}

Then tree builder may nest under a matching parent.

This should be treated as config-declared, not automatic timestamp inference.

Parser warning behavior

Parsers should support warning modes:

type WarningMode = "none" | "summary" | "all";
none

No warnings printed.

summary

Default.

Print summary such as:

Skipped 12 unparsable lines. Use --warnings all for details.
all

Print individual warning lines.

Example:

Line 14: Invalid JSON payload.
Line 21: Missing run ID.
Validation rules

A valid config must include:

runIdKeys
eventKey

Optional fields should have sensible defaults:

timestampKey = "timestamp"
messageKey = "message"
levelKey = "level"

Invalid config should produce a clear error message.

Examples:

Missing required field: runIdKeys
Missing required field: eventKey
Invalid redaction strategy: maskAll
Invalid mapping kind: DATABASE
Non-goals

The log ingest config should not become:

a scripting language
a general ETL system
a query engine
a replacement for logging frameworks
a production observability config
a vendor sink config

Keep it simple and local-debugging focused.