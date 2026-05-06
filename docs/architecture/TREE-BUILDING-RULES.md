# Tree Building Rules

## Purpose

Tree building is one of the most important parts of AgentInspect.

AgentInspect must help developers understand agent execution structure without lying about relationships that are not actually known.

The tree builder must be conservative, transparent, and trustworthy.

## Core rule

> A flat, honest timeline is better than a deeply nested but misleading tree.

For log-derived data, AgentInspect should default to a grouped timeline and only nest events when the relationship is explicit or safely declared.

## Non-negotiable rules

```text
Flat timeline by default.
Nest only with explicit parentId or config-declared parent.
Do not nest based only on timestamps.
Duration only when explicit or safely paired.
Confidence labels required.
Unknown relationships must remain visible.
Do not fake certainty.
Default behavior for logs

For structured logs, the default should be:

Run decision=01fe6bf1
├─ job:started
├─ agent:started
├─ tool:get_conversation_history
├─ llm:generate_message
└─ result:notification

This is intentionally flat.

Flat does not mean less useful. A grouped timeline already solves a real pain:

which events belong to the same run
what happened in order
which tools and LLMs were involved
where errors happened
which steps were slow
what metadata matters
which relationships are explicit or inferred
When nesting is allowed

Nesting is allowed only when there is trustworthy relationship data.

1. Explicit parent ID exists

Example event:

{
  "event": "tool.search.completed",
  "eventId": "tool_123",
  "parentId": "agent_456",
  "runId": "run_789",
  "timestamp": 1746451218130
}

This may render as:

agent:run
└─ tool:search

Confidence:

explicit
2. Adapter provides parent relationship

Framework callbacks may provide parent run IDs.

Example:

handleToolStart(tool, input, runId, parentRunId)

If parentRunId is provided, nesting is allowed.

Confidence:

explicit
3. Config declares parent relationship

A config mapping may define a parent relationship.

Example:

{
  "mappings": {
    "proactive.tool.search": {
      "kind": "TOOL",
      "name": "tool:search",
      "parent": "agent:started"
    }
  }
}

This may allow nesting if the parent event exists in the same run.

Confidence should be:

heuristic

or a future value if config-declared confidence is added.

4. Safe start/end pairing

Start/end pairing may be allowed when both events clearly describe the same step.

Example:

{"event":"proactive.llm.generate_message","decisionId":"01fe6bf1","timestamp":1000}
{"event":"proactive.llm.generate_message_completed","decisionId":"01fe6bf1","timestamp":3000,"durationMs":2000}

This may be rendered as one logical LLM node with duration.

This should not automatically create parent-child nesting. It may combine lifecycle events into one display node when safe.

Confidence:

correlated

or

heuristic

depending on the implementation.

When nesting is not allowed
1. Timestamp proximity alone

Do not do this:

agent:plan
└─ tool:searchHotels

if the only reason is that tool:searchHotels happened shortly after agent:plan.

Timestamp order does not prove parent-child relationship.

2. Similar event names alone

Do not nest only because names look related.

Example:

agent.started
tool.search

These may be related, but without parent ID or config, they should remain siblings.

3. Same run ID alone

Same run ID means the events belong to the same run.

It does not mean one event is the parent of another.

Same run ID should usually produce correlated confidence and flat sibling display.

4. Missing parent

If an event references a parent ID that is not present, do not invent the parent.

Options:

show as root-level child
preserve parent ID in metadata
mark confidence as unknown or correlated
add warning if useful
5. Ambiguous parent candidates

If multiple possible parents exist, do not guess.

Keep event flat and show uncertainty.

Confidence labels

Every event or relationship should carry confidence.

export type AttributionConfidence =
  | "explicit"
  | "correlated"
  | "heuristic"
  | "unknown";
explicit

Use when parent-child relationship is directly known.

Examples:

manual step context
parentId
parentSpanId
adapter parentRunId
correlated

Use when event belongs to the same run but exact hierarchy is not known.

Examples:

same decisionId
same requestId
same jobId
heuristic

Use when inference is based on mapping, naming, or safe pairing.

Examples:

config-declared parent
start/end event pairing
strong lifecycle convention
unknown

Use when relationship or grouping is ambiguous.

Examples:

no run ID
missing parent
conflicting data
invalid or partial log
Rendering confidence

By default:

Always show confidence for non-explicit relationships.
It is acceptable to hide explicit confidence in compact mode.
Provide a verbose mode that shows all confidence values.
Warn when a tree is heavily heuristic.

Example:

Run decision=01fe6bf1
├─ job:started
│  confidence: explicit
├─ agent:started
│  confidence: correlated (same decisionId)
├─ tool:get_conversation_history
│  confidence: correlated (same decisionId)
└─ llm:generate_message
   confidence: correlated (same decisionId + paired events)
Duration rules

Duration is useful, but wrong duration is misleading.

Allowed duration sources

Use duration when:

durationMs exists
startedAt and endedAt are safely paired
start/end event pairing is explicit
adapter provides lifecycle start/end
manual step records start/end
Forbidden duration inference

Do not infer duration from the next unrelated timestamp.

Bad:

event A timestamp = 1000
event B timestamp = 5000

Assume A duration = 4000

This is wrong because event B may be unrelated.

Missing duration

If duration is unknown, omit it.

Do not display 0ms unless duration is explicitly zero.

Do not display fake timing.

Status rules
Event status

Allowed normalized status:

"running" | "ok" | "error"
Unknown status

If status cannot be determined, leave it undefined or use an explicit unknown status in metadata if the relevant type supports it.

Do not default unknown to success.

Run status

A run may be:

ok
error
running
unknown/undefined

Rules:

If any critical error exists, run should likely be error.
If explicit run completion says success, run may be ok.
If no completion exists, run may be running.
If not enough data exists, leave unknown.
Tree builder algorithm guidance

A conservative tree builder should roughly follow this approach:

1. Group events by runId.
2. Sort each run by timestamp when timestamps are available.
3. Create nodes for each event.
4. Build an ID lookup by eventId.
5. Attach child to parent only when parentId exists and parent is found.
6. Apply config-declared parent rules only when unambiguous.
7. Leave all other events as root-level children.
8. Compute metadata.
9. Preserve confidence labels.
10. Render flat grouped timeline by default.
Example: flat grouped timeline

Input:

{"event":"proactive.job.started","decisionId":"01fe6bf1","timestamp":1000}
{"event":"proactive.agent.started","decisionId":"01fe6bf1","timestamp":1100}
{"event":"proactive.tool.search","decisionId":"01fe6bf1","timestamp":2000}
{"event":"proactive.llm.generate","decisionId":"01fe6bf1","timestamp":3000}

Output:

Run decision=01fe6bf1
├─ job:started
│  confidence: explicit
├─ agent:started
│  confidence: correlated (same decisionId)
├─ tool:search
│  confidence: correlated (same decisionId)
└─ llm:generate
   confidence: correlated (same decisionId)
Example: explicit nesting

Input:

{"eventId":"agent_1","event":"agent.started","runId":"run_1","timestamp":1000}
{"eventId":"tool_1","parentId":"agent_1","event":"tool.search","runId":"run_1","timestamp":2000}

Output:

Run run_1
└─ agent:started
   └─ tool:search
      confidence: explicit
Example: missing parent

Input:

{"eventId":"tool_1","parentId":"missing_agent","event":"tool.search","runId":"run_1","timestamp":2000}

Output:

Run run_1
└─ tool:search
   confidence: unknown (parent missing: missing_agent)

Do not invent missing_agent.

Example: unsafe nesting to avoid

Input:

{"event":"agent.plan","decisionId":"d1","timestamp":1000}
{"event":"tool.searchHotels","decisionId":"d1","timestamp":1200}

Bad output:

agent:plan
└─ tool:searchHotels

Correct output:

Run decision=d1
├─ agent:plan
│  confidence: correlated (same decisionId)
└─ tool:searchHotels
   confidence: correlated (same decisionId)
Warnings

Tree builder should warn when:

many events are unknown
many relationships are heuristic
parent IDs are missing
malformed lines were skipped
timestamps are missing
run IDs are missing

Warnings should be useful but not noisy.

Default warning mode should be summary.

Non-goals

The tree builder should not become:

a probabilistic trace reconstruction engine
a replay engine
a workflow engine
a production span processor
a generic log analytics engine

The goal is local debugging clarity, not perfect distributed tracing.