# Product Principles

## Purpose

This document defines the product principles that guide AgentInspect.

These principles should be read before implementation work, roadmap changes, PRD updates, and Cursor prompts.

AgentInspect should stay focused on its accepted mission:

> AgentInspect helps TypeScript developers understand AI agent execution faster by turning manual traces, structured logs, and framework callbacks into trustworthy local execution trees.

---

# 1. Product direction

AgentInspect is a local-first execution-tree debugging tool for TypeScript AI systems.

The product should help developers answer questions like:

```text
What happened in this agent run?
Which logs belong together?
Which tool was called?
Where did the LLM call happen?
Which step failed?
Which step was slow?
Was this sequential or parallel?
What changed between two runs?

AgentInspect should work with:

manual traces
structured logs
framework callbacks
local JSONL trace files
terminal output
future standards-aligned export formats

The main post-MVP wedge is:

Turn structured agent logs into trustworthy local execution trees.

This is the clearest path because developers already have logs, but those logs are flat and hard to reason about.

2. Why the pivot happened

The v0.1 MVP proved the manual tracing foundation:

import { inspectRun, step, observe } from "agent-inspect";

await inspectRun("trip-planner", async () => {
  const plan = await step("plan", async () => planner.run());
  const hotels = await step.tool("searchHotels", async () => searchHotels(plan));
  return step("finalize", async () => finalize(plan, hotels));
});

This is useful, but manual instrumentation alone is not enough.

Real TypeScript AI systems often already emit logs through:

log4js
pino
winston
NestJS logger
custom job runners
New Relic
Braintrust
Langfuse
framework callbacks

The problem is that these logs are usually flat.

Flat logs do not clearly show:

which events belong to the same agent run
what was sequential versus parallel
which tool belongs to which decision
where LLM calls happened
which step failed
which step was slow
which metadata matters
which relationships are explicit versus inferred

The pivot is to meet developers where they already are:

They already have logs. AgentInspect should turn those logs into local execution trees or grouped timelines.

3. Core product principles
3.1 Local-first

AgentInspect must work without:

account creation
SaaS backend
cloud ingestion
Docker stack
hosted dashboard
vendor API key

Local trace files and terminal inspection are the default workflow.

Local-first means:

developers can run it during local development
teams can use it before adopting production observability
examples can run without external services
debugging does not require uploading data to a third party
3.2 Execution tree over flat logs

AgentInspect exists to help developers see execution structure.

The goal is to move from flat logs like this:

job started
agent started
tool called
llm called
result created

to a grouped execution view like this:

Run decision=01fe6bf1
├─ job:started
├─ agent:started
├─ tool:get_conversation_history
├─ llm:generate_message
└─ result:notification

For logs, the first useful step is a grouped timeline. A deeply nested tree is only useful when the relationships are known.

3.3 Works with what developers already have

AgentInspect should support manual step() instrumentation, but it should not require developers to rewrite their agent systems.

It should increasingly support:

JSON logs
log4js text logs with embedded JSON
pino/winston-style structured logs
NestJS structured logging
LangChain callbacks
Vercel AI SDK recipes
OpenAI/Anthropic/Gemini SDK wrappers

The adoption path should be low-friction:

I already have logs.
I add a small config.
I get a local execution timeline.
3.4 JSON logs first-class, text logs best-effort

Line-delimited JSON logs are the canonical ingestion path.

Text logs are supported only when they contain embedded valid JSON.

AgentInspect must not:

use eval
parse JavaScript object strings
treat arbitrary text logs as reliable structured data
silently invent missing fields
3.5 Confidence labels are mandatory

Every log-derived relationship must show confidence.

export type AttributionConfidence =
  | "explicit"
  | "correlated"
  | "heuristic"
  | "unknown";

Meanings:

explicit   = parentId/spanId/manual step context exists
correlated = same runId/decisionId/requestId
heuristic  = inferred from event pattern/time window/config
unknown    = ambiguous or ungrouped

Confidence is part of the product’s trust model.

3.6 Never silently invent parent-child relationships

Bad:

tool:searchHotels nested under agent:plan only because it happened nearby

Good:

Run decision=d1
├─ agent:plan
│  confidence: correlated
└─ tool:searchHotels
   confidence: correlated

A flat and honest timeline is better than a misleading tree.

3.7 Flat timeline by default for logs

For log-derived data, the default should be a grouped timeline.

Nest only when:

explicit parentId exists
mapping config declares parent relationship
start/end events can be safely paired
adapter callback provides parentRunId

Do not nest based only on timestamp proximity.

Do not nest based only on similar event names.

Do not nest based only on same run ID.

3.8 Duration only when explicit or safely paired

Duration should be shown only when:

durationMs exists
startedAt and endedAt are safely paired
start/end event pairing is explicit
adapter lifecycle provides duration
manual step records duration

Do not infer duration from the next unrelated log timestamp.

Missing duration is better than fake duration.

3.9 Redaction is required

AgentInspect processes logs and traces that may contain sensitive data.

Default sensitive keys:

authorization
cookie
token
apiKey
password
secret
email

AgentInspect should redact obvious secrets in terminal output and shareable exports.

IDs used for debugging can be partially masked:

f0769fd4-1234-5678-9abc-abcdef000001 -> f0769fd4…
3.10 Lean dependency policy

The main package should remain small.

Approved runtime dependencies:

chalk
commander
nanoid

Avoid in the main package:

cli-table3
uuid
Ink
React
LangChain
vendor observability SDKs
heavy parser libraries

Optional features should become separate packages.

Examples:

@agent-inspect/langchain
@agent-inspect/tui
3.11 Standards alignment later, local utility first

OpenInference and OpenTelemetry GenAI alignment matter.

But standards should not slow down the first local debugging value.

Use careful language:

OpenInference-compatible
OTel GenAI-aligned
OTLP JSON experimental until verified

Avoid overclaiming:

Works with every observability backend
Guaranteed vendor compatibility
4. What AgentInspect is

AgentInspect is:

a local execution-tree inspector
a structured log-to-tree tool
a manual trace tool
a JSONL trace store
a terminal-native debugging aid
a future adapter surface
a bridgeable local trace format
A local execution-tree inspector

AgentInspect should make it easier to understand what happened in an agent run.

A structured log-to-tree tool

AgentInspect should turn structured logs into grouped timelines or execution trees.

A manual trace tool

AgentInspect should continue to support explicit tracing through inspectRun() and step().

A JSONL trace store

AgentInspect should store local traces in a simple file format that can be inspected and processed.

A terminal-native debugging aid

The CLI should remain the primary interface.

A future adapter surface

Framework adapters can improve confidence later, but should not replace the local-first model.

A bridgeable local trace format

Exporters can later bridge local traces into OpenInference/OTLP-style formats.

5. What AgentInspect is not

AgentInspect is not:

a SaaS product
a production observability platform
a hosted dashboard
an agent framework
a cost/pricing platform
a replay engine
a generic logging framework
a vendor-specific SDK
Not a SaaS product

No account should be required.

Not a production observability platform

AgentInspect should not compete directly with LangSmith, Langfuse, Braintrust, New Relic, Datadog, or Phoenix.

Not a hosted dashboard

No web dashboard before v1.0.

Not an agent framework

AgentInspect should inspect agent workflows, not orchestrate them.

Not a cost platform

Token metadata may be captured, but cost calculation is not a near-term goal.

Not a replay engine

Diff and compare are allowed. Replay/fork execution is out of scope.

Not a generic logging framework

AgentInspect consumes logs. It should not replace logging libraries.

Not a vendor-specific SDK

Vendor integrations are not part of the core product before v1.0.

6. Target users and pain points
Primary users

TypeScript and Node.js developers building AI systems with:

custom agents
job runners
tool-calling flows
RAG pipelines
LangChain.js
LangGraph.js
Vercel AI SDK
raw OpenAI/Anthropic/Gemini SDKs
NestJS services
pino/winston/log4js
Primary pain points

They can see logs, but they cannot easily understand execution flow.

They need to know:

What happened in this run?
Which events belong together?
Which tool was called?
Which LLM call happened?
Where did the agent decide?
Where did it fail?
Why was it slow?
What changed between runs?
Secondary users

Teams running evals and regression tests for agents.

They need to compare passing and failing runs.

Tertiary users

Teams that already have production observability but still want a local developer view.

7. High-level architecture

All sources should normalize into one model.

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
Manual traces:
  inspectRun()
  step()
  step.llm()
  step.tool()
  observe()

Structured logs:
  JSONL logs
  log4js text logs with JSON payload
  pino/winston-style JSON logs

Framework callbacks:
  LangChain.js BaseCallbackHandler
  future Vercel AI SDK recipes/adapters
  future OpenAI/Anthropic wrappers

Standards:
  OpenInference-compatible spans
  OTel GenAI-aligned attributes
Shared model

Everything should converge into:

InspectEvent
InspectNode
InspectRunTree
AttributionConfidence
InspectKind

This model supports:

CLI rendering
JSON output
live tail
export
diff
adapters
8. Roadmap overview
Step 0  v0.3 spike only
v0.2    Local Inspection Pro
v0.3    Log-to-Tree
v0.4    Live Tail
v0.5    LangChain Adapter
v0.6    Optional TUI
v0.7    Standards Export
v0.8    Diff & Compare
v0.9    Recipes & Integration Hardening
v1.0    Stable Local Agent Inspector
Why the sequence matters

The v0.3 spike validates the core product pivot.

If log-to-tree is not useful, the project should reassess before building more layers.

If log-to-tree is useful, then v0.2 improves the local trace foundation, and full v0.3 turns the spike into a real feature.

9. Go/no-go gates
After v0.3 spike

Go if:

output is clearer than raw logs
confidence labels make sense
grouped timeline helps understand the run
errors and slow steps are visible
log4js best-effort parsing is acceptable

No-go if:

output is no better than raw logs
config is too hard
tree implies relationships that are not true
logs do not contain enough structure
After full v0.3

Go if:

2+ developers find log-to-tree useful on real logs
confidence labels are trusted
JSON logs parse reliably
log4js best-effort parsing is acceptable
redaction works
Before v1.0

Go only if:

5+ teams use it in real workflows
schema is stable
docs are strong
support issues are manageable
no open P0 bugs
10. Cursor execution model

Every Cursor task should follow this order:

1. Read docs/strategy/CANONICAL-POST-MVP-PLAN.md.
2. Read docs/strategy/PRODUCT-PRINCIPLES.md.
3. Read docs/implementation/CURSOR-RULES.md.
4. Read docs/roadmap/GO-NO-GO-GATES.md.
5. Read the current version PRD.
6. Read the current implementation guide.
7. Inspect current source files.
8. Implement only the requested phase.
9. Add tests.
10. Run validation.
11. Stop and report.

Cursor must not:

assume event names
add dependencies without approval
silently infer parent-child relationships
start v0.4+ before v0.3 validation
build dashboards
build vendor sinks before v1.0
add TUI dependencies to the main package
Standard validation commands
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm pack:smoke
Current priority

The current priority is:

1. Create canonical docs.
2. Commit docs.
3. Create examples/06-log-to-tree spike.
4. Review spike output.
5. If spike passes, implement v0.2.
6. Then implement full v0.3.