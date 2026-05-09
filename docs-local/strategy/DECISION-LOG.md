# Decision Log

## Purpose

This decision log records important product and architecture decisions for AgentInspect.

It exists so future contributors and Cursor do not reopen settled debates without new evidence.

AgentInspect has gone through several rounds of research and planning. Some earlier directions were intentionally more aggressive, including adapter-first observability, production sinks, and TUI-heavy workflows. The current decision is more grounded:

> AgentInspect should become a local-first execution-tree debugging tool for TypeScript AI systems, with structured log-to-tree reconstruction as the strongest post-MVP wedge.

---

## Decision status labels

Use these labels:

```text
Accepted
Superseded
Needs validation
Deferred
Rejected
Decision 1: Log-to-tree before adapters
Status

Accepted

Decision

AgentInspect should validate structured log-to-tree reconstruction before building framework adapters.

Context

The v0.1 MVP proved manual tracing with:

inspectRun()
step()
step.llm()
step.tool()
observe()
local JSONL traces
CLI list/view

Manual tracing is useful, but real AI systems often already emit logs through:

log4js
pino
winston
NestJS logger
custom job runners
New Relic
Braintrust
Langfuse
framework callbacks

The pain is that these logs are flat. Developers cannot easily see:

which logs belong to the same agent run
where LLM calls happened
which tool was called
which step failed
which step was slow
what was sequential versus parallel
which relationships are explicit versus inferred
Rationale

Log-to-tree is the lowest-friction path because it works with data developers already have.

Adapters can improve confidence later, but starting with adapters would limit the audience too early.

Consequences

Do:

run v0.3 spike first
parse JSON logs first-class
support log4js best-effort
build a conservative tree model
show confidence labels

Do not:

start with LangChain adapter
start with Vercel AI SDK adapter
build agent-inspect/auto
add framework dependencies to core
Decision 2: Simple terminal output before Ink/TUI
Status

Accepted

Decision

AgentInspect should use simple CLI output before adding an interactive TUI.

Context

A TUI can be useful for large traces, but it adds complexity:

Ink dependency
React dependency
terminal compatibility issues
keyboard state
rendering complexity
cross-platform behavior
maintenance burden

The core value should be visible through plain terminal output first.

Rationale

Simple CLI output is:

easier to implement
easier to test
easier to use in CI
easier to pipe
easier to copy into issues and PRs
compatible with SSH and dev containers
better for early validation
Consequences

Do:

build reliable CLI tree rendering
support JSON output
support Markdown export later
support non-interactive fallback

Do not:

add Ink to the main package
add React to the main package
build TUI before v0.3 is validated
make TUI the default interface

TUI remains optional and belongs in a separate package:

@agent-inspect/tui
Decision 3: Confidence labels are mandatory
Status

Accepted

Decision

Every log-derived relationship must carry confidence.

Context

Log-derived execution trees can be misleading if AgentInspect hides uncertainty.

For manual traces, parent-child relationships are usually explicit.

For logs, relationships may be based on:

same run ID
same decision ID
same request ID
event name patterns
config mappings
timestamps
start/end pairing

These are not all equally trustworthy.

Rationale

A wrong tree is worse than a flat log.

Trust depends on showing how each relationship was determined.

Confidence levels
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
Consequences

Do:

display confidence for non-explicit relationships
preserve confidence in JSON output
include confidence breakdown in summaries
warn when output is heavily heuristic

Do not:

silently infer parent-child relationships
hide uncertainty
mark heuristic as explicit
default unknown to success or certainty
Decision 4: OpenInference/OTel later, design-compatible now
Status

Accepted

Decision

AgentInspect should design the internal event model so it can later map to OpenInference and OpenTelemetry GenAI, but standards export should not be the first post-MVP feature.

Context

OpenInference and OTel GenAI are important standards in AI observability.

They include concepts like:

LLM spans
agent spans
chain spans
tool spans
retriever spans
token usage
model metadata
input/output attributes

AgentInspect should not ignore these standards.

However, chasing compliance too early can slow local product value.

Rationale

The immediate user problem is local debugging clarity.

Standards are useful after the internal model is proven.

Consequences

Do:

use an event model that can map to standards
include InspectKind values like LLM, TOOL, AGENT, CHAIN, RETRIEVER
preserve metadata needed for export
use careful compatibility language

Do not:

start with OpenTelemetry SDK integration
add heavy OTel dependencies in core
claim broad backend compatibility before testing
build vendor sinks before local value is proven

Preferred wording:

OpenInference-compatible
OTel GenAI-aligned
OTLP JSON experimental until verified

Avoid:

Works with every observability backend
Guaranteed Langfuse/Braintrust/New Relic support
Decision 5: No vendor sinks before local value is proven
Status

Accepted

Decision

AgentInspect should not build vendor-specific production sinks before v1.0.

Context

Potential sinks include:

Langfuse
Braintrust
New Relic
Datadog
Phoenix
OTLP collectors

These integrations can be valuable, but they shift AgentInspect toward production observability.

Rationale

Vendor sinks create:

maintenance burden
compatibility promises
authentication complexity
support overhead
confusion about product boundary

AgentInspect’s core identity is local execution-tree debugging.

Consequences

Do:

export local traces later
support Markdown/HTML/OpenInference/OTLP JSON exports
test specific compatibility before claiming it

Do not:

build live vendor streaming before v1.0
add vendor SDKs to the main package
market AgentInspect as production monitoring
compete directly with observability platforms

Vendor-specific sinks are v1.1+ territory.

Decision 6: No agent-inspect/auto until explicit adapters prove themselves
Status

Accepted

Decision

Do not build magical automatic instrumentation until explicit adapters are validated.

Context

Auto-instrumentation sounds attractive, but it can reduce trust.

Problems include:

surprising behavior
hard-to-debug patching
unexpected performance overhead
compatibility issues
implicit data capture
unclear parent-child relationships
Rationale

AgentInspect should earn trust through explicit APIs and honest output.

Manual tracing, structured logs, and official callbacks are safer starting points.

Consequences

Do:

keep inspectRun() and step() explicit
parse logs explicitly
use official framework callbacks
require clear opt-in

Do not:

monkey-patch SDKs
auto-wrap all LLM calls
add agent-inspect/auto
capture prompts/outputs invisibly

This decision can be revisited only after explicit adapters are proven useful.

Decision 7: JSON logs first-class; log4js text best-effort
Status

Accepted

Decision

Line-delimited JSON logs are the canonical log ingestion path.

Text logs such as log4js are supported only when they contain embedded valid JSON payloads.

Context

Many real projects use log4js, pino, winston, or custom structured logs.

JSON logs are reliable to parse.

Text logs are often inconsistent and may include JavaScript-object-style strings that are unsafe to parse.

Rationale

AgentInspect should be useful with real logs but must stay safe and predictable.

Consequences

Do:

support JSONL logs first
parse log4js text best-effort
extract embedded valid JSON only
skip malformed lines with warnings
preserve source type

Do not:

use eval
parse JavaScript object strings
pretend text logs are fully reliable
build a complex log parser before validating value
Decision 8: Keep core package lean
Status

Accepted

Decision

The main AgentInspect package should remain small and dependency-light.

Approved runtime dependencies
chalk
commander
nanoid
Avoid in the main package
cli-table3
uuid
Ink
React
LangChain
vendor observability SDKs
heavy parser libraries
Context

AgentInspect is a developer utility and local debugging tool.

Heavy dependencies increase:

install size
security surface
maintenance burden
cross-platform risk
user hesitation
Rationale

A lightweight package is easier to adopt.

Optional functionality should live in separate packages.

Consequences

Do:

use internal table renderer
use Node built-ins where possible
use nanoid for generated IDs
keep TUI separate
keep LangChain adapter separate if peer deps are needed

Do not:

add dependencies without explicit approval
add cli-table3
add uuid
add Ink/React to core
add LangChain to core
Decision 9: Flat timeline by default for log-derived data
Status

Accepted

Decision

For log-derived events, AgentInspect should render a flat grouped timeline by default.

Context

Logs often contain correlation IDs but not explicit parent IDs.

Same run ID proves events belong together, but it does not prove hierarchy.

Rationale

A flat grouped timeline is honest and still useful.

It shows:

what happened
in what order
which run it belonged to
which kind of event each line represents
where errors happened
where durations exist

without inventing structure.

Consequences

Do:

group by run ID
render ordered siblings
show confidence
nest only with explicit or config-declared parent

Do not:

nest by timestamp proximity
nest by similar event names alone
imply agent/tool/LLM hierarchy without evidence
Decision 10: Duration only when explicit or safely paired
Status

Accepted

Decision

AgentInspect should show duration only when duration is explicit or safely paired.

Context

Wrong duration can mislead debugging.

In logs, the next timestamp is not necessarily the end of the previous event.

Rationale

Correct missing data is better than fake precision.

Consequences

Do:

use durationMs when present
use start/end lifecycle pairing only when safe
use adapter lifecycle callbacks when available
use manual step duration when recorded

Do not:

infer duration from the next unrelated log line
display fake 0ms
default unknown duration to a value
Decision 11: Redaction is required
Status

Accepted

Decision

AgentInspect must redact obvious sensitive fields in terminal output and shareable exports.

Context

Agent logs may contain:

tokens
cookies
emails
API keys
user IDs
prompt data
tool inputs and outputs
Rationale

Local-first does not mean safe to expose.

Developers may copy terminal output into GitHub issues, Slack, PRs, or documents.

Default sensitive keys
authorization
cookie
token
apiKey
password
secret
email
Consequences

Do:

redact terminal output by default
support named redaction strategies
support prefix masking for useful IDs
support hashing later if needed
avoid full prompt/output capture by default

Do not:

expose obvious secrets
support function strings in config
require users to remember every sensitive key manually
Decision 12: v1.0 stability should not be rushed
Status

Accepted

Decision

Do not declare v1.0 until the local debugging workflow is validated and stable.

Required before v1.0
v0.3 validated and adopted
v0.4-v0.8 stable
v0.9 hardening complete
5+ teams using in real workflows
6 months without breaking changes
no open P0 bugs
Rationale

v1.0 is a commitment.

It should mean:

stable APIs
stable schema
stable CLI
migration guidance
cross-platform confidence
maintenance posture
Consequences

Do:

use semver carefully
mark adapter/sink APIs experimental if not validated
stabilize JSONL schema
write migration guides
test cross-platform

Do not:

freeze unstable APIs
promise unsupported integrations
declare v1.0 for marketing reasons only
Decision 13: Archive older exploratory notes
Status

Accepted

Decision

Older brainstorming, aggressive pivot analysis, and pre-publish notes should be archived, not deleted.

Context

Older docs contain useful reasoning but should not override the canonical plan.

Rationale

Cursor can become confused if old exploratory documents look like active instructions.

Consequences

Do:

move old notes to docs/archive/
mark them as archived reference only
keep them available for context

Do not:

delete useful historical reasoning
let archived notes override active strategy, PRDs, or implementation guides

Recommended archive notice:

Archived reference only.
Do not use as implementation source.
Use docs/strategy/CANONICAL-POST-MVP-PLAN.md instead.
Current accepted direction

The accepted product mission is:

AgentInspect helps TypeScript developers understand AI agent execution faster by turning manual traces, structured logs, and framework callbacks into trustworthy local execution trees.

The accepted immediate path is:

1. Create canonical docs.
2. Run v0.3 log-to-tree spike.
3. If spike passes, implement v0.2.
4. Then implement full v0.3.
5. Continue only after validation gates pass.