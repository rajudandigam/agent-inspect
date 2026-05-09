Reviewed the updated fixes. The plan is now much closer to canonical and is aligned with the recent pivot: AgentInspect should become a local-first execution-tree inspector for TypeScript AI systems, with the strongest near-term wedge being structured log-to-tree reconstruction.
The fixes you added address the major gaps I flagged:
The missing v0.9 guide is now present and correctly positioned as recipes, adoption hardening, fixture catalog, conformance tests, documentation cleanup, feedback integration, migration validation, and pre-v1.0 polish.
The v0.3 guide continues to correctly treat log-to-tree as the make-or-break validation point, with JSON logs first-class, log4js best-effort, no function strings in config, nanoid instead of uuid, conservative duration inference, flat timeline by default, source type preservation, controllable warnings, and separate JSON/log4js examples.
The v0.4 guide now fixes the multi-run inconsistency by making split-panel multi-run display out of scope while still allowing basic multi-run listing.
The v0.5 guide correctly narrows the LangChain adapter to token usage metadata and explicitly excludes cost calculation.
The v0.6 guide now keeps the TUI as a separate explicit install and avoids adding @agent-inspect/tui as an optional dependency, which protects the lean core package.
The v0.7 guide now narrows standards export claims to Phoenix and OTLP collectors, with other platforms treated as optional/best-effort rather than guaranteed compatibility.
The v1.0 guide now marks adapter and sink APIs as experimental instead of freezing them prematurely, and it updates the release flow to use pnpm + Changesets + GitHub Actions publishing.
Remaining small fixes before locking the docs
There are only a few cleanup items left.
First, the v0.3 spike still has a filename mismatch. The guide names the file prototype-parser.ts, but the run command says:
node prototype-parser.mjs

Make that consistent. Since the spike should be dependency-free, use:
examples/06-log-to-tree/prototype-parser.mjs

and write plain JavaScript, not TypeScript. Do not require tsx for the spike.
Second, the v1.0 guide still has a small Node version inconsistency. The scope section says cross-platform testing for Node 18/20/22, but the support section correctly updates the matrix to Node 20/22/24. The runtime compatibility section also says primary Node.js 18+. Update all of that to one consistent policy:
Primary supported Node versions at v1.0:
- Node 20, if still required by users
- Node 22
- Node 24

Node 18:
- not officially supported for v1.0
- best-effort only if tests still pass

Third, the v1.0 sink interface note says “Only LangChain adapter uses this,” but LangChain is an adapter, not a sink. Change the note to:
These interfaces are experimental because only one adapter exists and zero production sinks exist in v1.0.

Fourth, the v0.7 guide still says “Vendor-specific sinks v0.8” in future enhancements, but v0.8 is Diff & Compare. Update that to:
Vendor-specific sinks v1.1+

After these small edits, the docs are good enough to become the canonical project resource.

Canonical Summary for AgentInspect Development
1. Product direction
AgentInspect is a local-first execution-tree debugging tool for TypeScript AI systems.
It helps developers understand what an AI agent did step by step by transforming manual traces, structured logs, framework callbacks, and later standards-aligned spans into readable local execution trees.
AgentInspect should not become a SaaS product, web dashboard, generic logging framework, production monitoring platform, or agent framework. Its strongest identity is:
Local execution-tree debugging for TypeScript agents.

The current MVP proved the manual tracing foundation:
import { inspectRun, step } from "agent-inspect";

await inspectRun("trip-planner", async () => {
  const plan = await step("plan", async () => planner.run());
  const hotels = await step.tool("searchHotels", async () => searchHotels(plan));
  return step("finalize", async () => finalize(plan, hotels));
});

The post-MVP product pivot is to make AgentInspect useful in real agent systems where developers already have logs but cannot understand execution flow.
The next core wedge is:
Turn structured agent logs into local execution trees.

This is not just “beautifying logs.” The real problem is that existing logs are flat. They do not clearly show:
- which events belong to the same agent run
- what was sequential versus parallel
- which tool belongs to which agent decision
- where LLM calls happened
- which step failed
- which step was slow
- which metadata matters
- which relationships are explicit versus inferred

AgentInspect should reconstruct as much structure as possible, but it must be honest when structure is inferred.

2. Core principles
These principles must guide every version and every Cursor prompt.
2.1 Local-first
AgentInspect must work without:
- account creation
- SaaS backend
- cloud ingestion
- Docker stack
- hosted dashboard
- vendor API key

Local trace files and terminal inspection remain the default workflow.
2.2 Execution tree over flat logs
The output should help developers see agent execution as a run tree or grouped timeline:
Run decision=01fe6bf1
├─ job:started
├─ agent:started
├─ tool:get_conversation_history
├─ llm:generate_message
└─ result:notification

2.3 Works with what developers already have
Manual step() remains useful, but real projects often already use:
- log4js
- pino
- winston
- NestJS logger
- custom job logs
- LangChain callbacks
- Vercel AI SDK telemetry
- OpenAI/Anthropic/Gemini SDK wrappers

AgentInspect should meet developers where they are.
2.4 JSON logs first-class, text logs best-effort
Line-delimited JSON logs are the canonical supported ingestion path.
Text logs with embedded JSON, such as log4js output, are supported best-effort.
Do not build fragile JavaScript-object-string parsing as a core assumption.
2.5 Confidence labels are mandatory
Every log-derived relationship must carry confidence:
type AttributionConfidence =
  | "explicit"
  | "correlated"
  | "heuristic"
  | "unknown";

Meaning:
explicit   = parentId/spanId/manual step context exists
correlated = same runId/decisionId/requestId
heuristic  = inferred from event pattern/time window
unknown    = ambiguous or ungrouped

2.6 Never silently invent parent-child relationships
This is one of the most important rules.
Bad:
tool:searchHotels nested under agent:plan only because it happened nearby

Good:
tool:searchHotels shown as a sibling with confidence=correlated

2.7 Flat timeline by default
For logs, the default should be a grouped run timeline, not an aggressively nested tree.
Nest only when:
- explicit parentId exists
- mapping config declares parent relationship
- start/end events can be safely paired
- adapter callback provides parentRunId

2.8 Duration only when explicit or safely paired
Never infer duration from the next unrelated log timestamp.
Show duration only when:
- durationMs exists
- startedAt and endedAt are paired safely
- start/end event pairing is explicit

Otherwise omit duration.
2.9 Redaction is required
AgentInspect will process real logs. It must avoid leaking secrets in terminal output.
Default sensitive keys should include:
authorization
cookie
token
apiKey
password
secret
email

ID values used for debugging can be partially masked, for example:
f0769fd4-1234-... → f0769fd4…

2.10 Lean dependency policy
The core package should remain small.
Approved runtime dependencies:
chalk
commander
nanoid

Do not add dependencies like cli-table3, uuid, or TUI packages without explicit review.
2.11 Standards alignment later, local utility first
OpenInference and OpenTelemetry alignment matter, but they should not slow down local debugging value.
Use “aligned” language before claiming full compliance.

3. Current implementation baseline
AgentInspect is already published and has the MVP foundation:
inspectRun()
step()
step.llm()
step.tool()
observe()
JSONL traces
CLI list/view
examples
package smoke tests
npm publishing
Trusted Publishing/OIDC

The next roadmap must preserve the MVP strengths:
- TypeScript-first
- local-first
- no cloud dependency
- simple API
- CLI-first
- JSONL-based
- framework-agnostic

But the next roadmap should expand from manual instrumentation into real project workflows.

4. High-level architecture
4.1 Input sources
AgentInspect should eventually support these input sources:
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

4.2 Normalized model
Everything should normalize into a shared event model:
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

export type AttributionConfidence =
  | "explicit"
  | "correlated"
  | "heuristic"
  | "unknown";

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
  source: {
    type: "manual" | "json-log" | "log4js" | "pino" | "winston" | "adapter";
    file?: string;
    line?: number;
  };
}

The v0.3 guide already defines this model and should become the canonical schema foundation for log-to-tree work.
4.3 Tree model
export interface InspectNode {
  event: InspectEvent;
  children: InspectNode[];
  depth: number;
}

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

4.4 Data flow
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

4.5 Execution flow diagram
flowchart TD
    A[Manual step API] --> N[Normalize to InspectEvent]
    B[JSON logs] --> P[JSON parser]
    C[log4js logs] --> L[Best-effort log4js parser]
    D[LangChain callbacks] --> LC[LangChain adapter]

    P --> N
    L --> N
    LC --> N

    N --> R[Redaction]
    R --> T[Conservative Tree Builder]
    T --> CLI[CLI Renderers]
    T --> J[JSONL Store]
    T --> E[Exporters]
    T --> D2[Diff Engine]
    T --> TAIL[Live Tail]


5. Roadmap overview
Roadmap sequence
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

The unusual order is intentional:
1. Validate log-to-tree with a spike first.
2. Implement v0.2 CLI improvements after the spike passes.
3. Implement full v0.3 only if the spike proves value.

The guides correctly treat the v0.3 spike as mandatory and warn not to start full implementation before proving log-to-tree on real data.

6. Step 0 — v0.3 Spike
Purpose
The spike validates the entire post-MVP strategy.
Do not build production infrastructure first. Do not build abstractions first. Do not implement the full parser first.
The spike should answer one question:
Does a local log-to-tree view help understand a real agent run faster than raw logs?

Deliverables
Create:
examples/06-log-to-tree/
  sample-json.log
  sample-log4js.log
  agent-inspect.logs.json
  expected-output.txt
  prototype-parser.mjs
  README.md

Required files
sample-json.log
Canonical success path. Use line-delimited JSON.
{"event":"proactive.job.started","jobId":"7a06467f","decisionId":"01fe6bf1","timestamp":1746451218130}
{"event":"proactive.agent.started","trips":1,"decisionId":"01fe6bf1","timestamp":1746451218132}
{"event":"proactive.tool.conversation_history_fetched","tripUuid":"89e28415","messageCount":19,"decisionId":"01fe6bf1","timestamp":1746451225624}
{"event":"proactive.llm.generate_message","model":"gemini-3.1-pro-preview","decisionId":"01fe6bf1","timestamp":1746451227831}
{"event":"proactive.llm.generate_message_completed","tokens":{"input":1200,"output":356},"decisionId":"01fe6bf1","timestamp":1746451229875,"durationMs":2044}
{"event":"proactive.result.notification","shouldNotify":true,"variant":"destination_content","decisionId":"01fe6bf1","timestamp":1746451230012}

sample-log4js.log
Best-effort text log with embedded valid JSON payload.
2026-05-05 12:20:18.130 [INFO] [default] - Job started {"event":"proactive.job.started","jobId":"7a06467f","decisionId":"01fe6bf1","timestamp":1746451218130}

agent-inspect.logs.json
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
    "proactive.tool.*": {
      "kind": "TOOL"
    },
    "proactive.llm.*": {
      "kind": "LLM"
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

Expected output
Run decision=01fe6bf1
├─ job:started job=7a06467f
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

Spike rules
Use dependency-free JavaScript:
cd examples/06-log-to-tree
node prototype-parser.mjs

Do not add tsx.
Do not add a new runtime dependency.
Do not implement reusable production modules yet.
Go/no-go
Go if:
- output is clearer than raw logs
- confidence labels make sense
- grouped timeline helps understand the run
- errors and slow steps are visible
- log4js best-effort parsing is acceptable

No-go if:
- output is no better than raw logs
- config is too hard
- tree implies relationships that are not true
- logs do not contain enough structure

If no-go, reassess before implementing v0.2/v0.3 production work.

7. v0.2 — Local Inspection Pro
Purpose
Improve the current MVP trace inspection before full log ingestion.
This version makes existing inspectRun() and step() traces easier to find, summarize, filter, view, and clean.
Scope
Implement:
agent-inspect list --status error
agent-inspect list --status success
agent-inspect list --name hotel
agent-inspect list --since 1h
agent-inspect list --since 24h
agent-inspect list --limit 50
agent-inspect list --json

agent-inspect view run_abc123 --summary
agent-inspect view run_abc123 --verbose
agent-inspect view run_abc123 --json
agent-inspect view run_abc123 --errors-only
agent-inspect view run_abc123 --metadata

agent-inspect clean --older-than 7d --dry-run
agent-inspect clean --older-than 7d
agent-inspect clean --keep 100 --dry-run

Support:
AGENT_INSPECT_TRACE_DIR=./traces agent-inspect list

Important implementation rules
Use actual current JSONL event names from the codebase.
Do not assume:
run_ended
step_ended

Check:
packages/core/src/storage.ts
packages/core/test/*.test.ts

Do not default unknown status to success.
Use:
export type TraceMetadataStatus =
  | "success"
  | "error"
  | "running"
  | "unknown";

No cli-table3.
Use a small internal table renderer.
Use ESM imports:
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

Clean command must verify files are AgentInspect traces before deleting.
New core modules
Suggested files:
packages/core/src/trace-directory.ts
packages/core/src/trace-metadata.ts
packages/core/src/trace-filter.ts
packages/core/src/trace-verification.ts
packages/core/src/utils/duration.ts

packages/cli/src/commands/clean.ts
packages/cli/src/renderers/table-renderer.ts

Cursor execution guidance
Before implementing v0.2, ask Cursor to inspect the actual current schema:
Read packages/core/src/storage.ts and all existing storage/inspect-run/step tests.
Identify the exact JSONL event names and event shapes currently written by AgentInspect.
Do not assume names from the guide.
Summarize the schema first before making changes.

Then implement v0.2 in small phases:
Phase 1: duration utility
Phase 2: trace directory manager
Phase 3: metadata extraction
Phase 4: filtering
Phase 5: list/view CLI flags
Phase 6: clean command
Phase 7: tests and docs

Tests
Add tests for:
- duration parsing
- trace directory resolution
- metadata extraction
- status unknown behavior
- trace filtering
- table rendering
- clean dry-run
- clean verification safety
- AGENT_INSPECT_TRACE_DIR

Success criteria
- list --status error finds failed runs
- view --summary gives useful run stats
- list --json works with jq
- AGENT_INSPECT_TRACE_DIR works across runtime and CLI
- clean --dry-run is safe
- no new dependencies added
- v0.1 traces remain readable


8. v0.3 — Log-to-Tree
Purpose
Parse structured logs into local execution trees or grouped timelines.
This is the core product validation version.
Scope
Implement:
agent-inspect logs ./agent.log --format json
agent-inspect logs ./agent.log --format log4js
agent-inspect logs ./agent.log --config agent-inspect.logs.json
agent-inspect logs ./agent.log --run-id-key decisionId
agent-inspect logs ./agent.log --event-key event
agent-inspect logs ./agent.log --json
agent-inspect logs ./agent.log --summary
agent-inspect logs ./agent.log --warnings summary
agent-inspect logs ./agent.log --warnings all

Public/internal API
import {
  JsonLogParser,
  Log4jsParser,
  EventNormalizer,
  TreeBuilder,
  Redactor,
} from "agent-inspect";

Only expose stable pieces intentionally. If unsure, keep parser classes internal and expose only CLI at first.
Data model
Use the InspectEvent, InspectNode, and InspectRunTree model defined earlier.
Config model
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

Parser rules
JSON parser:
- first-class
- line-delimited JSON
- skip malformed lines
- warnings summary by default

log4js parser:
- best-effort
- extract embedded valid JSON payload only
- skip JS-object-style strings
- do not eval
- do not use unsafe parsing

Normalizer rules
Extract:
- runId from first matching runIdKeys
- event name from eventKey
- timestamp from timestampKey
- status from statusKey or mapping
- duration only from durationKey
- parent only from parentIdKey
- attributes from remaining fields

Use nanoid for generated event IDs.
Tree builder rules
Default:
flat timeline grouped by run

Nest only when explicit:
event.parentId exists and parent is found
config-declared parent exists
future adapter provides parentRunId

Do not nest by time proximity alone.
Redaction rules
No function strings in JSON config.
Use:
type RedactionRule =
  | string
  | {
      key: string;
      strategy: "full" | "prefix" | "hash";
      keep?: number;
    };

Tests
Add tests for:
- JSON parser valid lines
- JSON parser malformed lines
- log4js parser valid embedded JSON
- log4js parser skips invalid JS-object style payloads
- warnings none/summary/all
- config loading
- mapping exact match
- mapping wildcard match
- redaction full/prefix/hash
- event normalization
- source type preservation
- flat tree default
- explicit parent nesting
- duration only when explicit
- CLI logs command

Success criteria
- spike passed
- real JSON logs parse
- real log4js sample parses best-effort
- output is clearer than raw logs
- confidence labels are trusted
- 2+ developers find it useful


9. v0.4 — Live Tail
Purpose
Watch agent logs as a live tree while the application runs.
The v0.4 guide now correctly allows basic multi-run list output while keeping split-panel multi-run display out of scope.
Scope
Implement:
npm run dev 2>&1 | agent-inspect tail --format log4js

agent-inspect tail --file ./logs/agent.log --format json

agent-inspect tail \
  --file ./logs/agent.log \
  --config agent-inspect.logs.json

agent-inspect tail --run-id decisionId=01fe6bf1
agent-inspect tail --refresh 100

In scope
- stdin stream reader
- file tail reader
- incremental parse
- active run grouping
- compact multi-run display
- throttled rendering
- Ctrl+C partial trace save
- non-interactive fallback

Out of scope
- Ink TUI
- keyboard navigation
- expand/collapse
- replay
- diff
- split panel multi-run display

Implementation rules
Use the same parser/normalizer/tree builder from v0.3.
Do not duplicate parsing logic.
Throttle screen rendering.
Use append-only output when not TTY.
Success criteria
- works during npm run dev
- does not freeze on rapid logs
- handles 100 events/sec
- Ctrl+C saves partial traces
- at least one real workflow prefers it to raw logs


10. v0.5 — LangChain Adapter
Purpose
Add one official framework adapter using LangChain.js callbacks.
This should prove explicit callback-based instrumentation and produce higher-confidence traces than logs alone.
The guide correctly narrows scope to token usage metadata and excludes cost calculation.
Package
npm install agent-inspect @agent-inspect/langchain

API
import { AgentInspectCallback } from "@agent-inspect/langchain";

await agent.invoke(
  { messages },
  {
    callbacks: [
      new AgentInspectCallback({
        runName: "support-agent-eval",
        traceDir: "./.agent-runs",
        capture: "metadata-only",
      }),
    ],
  },
);

Scope
- BaseCallbackHandler implementation
- LLM start/end/error
- tool start/end/error
- chain start/end/error
- agent action/end
- parentRunId mapping
- token usage metadata when available
- AsyncLocalStorage context bridge to inspectRun

Out of scope
- monkey-patching
- auto import
- Vercel AI SDK adapter
- Mastra adapter
- NestJS module
- cost calculation
- full prompt/output capture by default

Tests
- callback creates InspectEvent
- parentRunId maps correctly
- errors set status error
- token metadata captured when available
- manual step + LangChain callback coexist
- 100 concurrent tool calls preserve parents

Success criteria
- public LangChain example works
- internal eval workflow works
- adapter tree is more accurate than logs alone
- no monkey-patching
- stress test passes


11. v0.6 — Optional TUI
Purpose
Provide richer keyboard-driven trace inspection for complex traces.
This should stay optional and out of the main package dependency tree. The guide now explicitly says @agent-inspect/tui must be installed separately and should not be an optional dependency of the main package.
Package
npm install @agent-inspect/tui

CLI
agent-inspect view run_abc123 --tui

If missing:
TUI requires @agent-inspect/tui. Run: npm install @agent-inspect/tui

Scope
- Ink-based optional package
- keyboard navigation
- expand/collapse
- metadata panel
- error navigation
- help screen
- fallback to simple output

Out of scope
- mouse
- themes
- live updating TUI
- multi-run panels
- prompt editing
- replay/fork

Success criteria
- useful for traces with 50+ events
- simple output remains default
- navigation is intuitive
- works in common terminals


12. v0.7 — Standards Export
Purpose
Export local AgentInspect traces to standards-aligned formats.
The guide now correctly narrows the required tested target to Phoenix and OTLP collectors, and treats other platforms as optional/best-effort rather than guaranteed.
CLI
agent-inspect export run_abc123 --format openinference
agent-inspect export run_abc123 --format otlp-json
agent-inspect export run_abc123 --format markdown > run.md
agent-inspect export run_abc123 --format html > run.html
agent-inspect export run_abc123 --format openinference -o trace.json
agent-inspect export run_abc123 --format openinference --validate

Scope
- OpenInference JSON export
- OTLP JSON export
- Markdown export
- HTML single-file export
- schema validation
- Phoenix import testing

Out of scope
- live vendor streaming
- vendor-specific sinks
- OTLP gRPC
- custom span processors
- production deployment guides

Compatibility language
Use:
OpenInference-compatible
OTel GenAI-aligned
Tested against Phoenix
OTLP JSON experimental until verified

Avoid:
Works with every observability backend
Guaranteed Langfuse/Braintrust/New Relic support

Success criteria
- Phoenix import works
- OTLP JSON validates
- Markdown export useful in PRs
- HTML export shareable
- compatibility docs are honest


13. v0.8 — Diff & Compare
Purpose
Help developers debug eval flakiness and regressions by comparing two runs.
CLI
agent-inspect diff run_a run_b
agent-inspect diff run_a run_b --ignore-duration
agent-inspect diff run_a run_b --focus errors
agent-inspect diff run_a run_b --json
agent-inspect diff run_a run_b --check structure
agent-inspect diff run_a run_b --check outputs
agent-inspect diff run_a run_b --check all

Scope
- compare two runs
- structure comparison
- output comparison
- timing comparison
- error comparison
- first divergence
- side-by-side renderer
- JSON output

Out of scope
- replay
- automatic reruns
- cassette recording/playback
- multi-run statistical analysis
- time-travel debugging

Success criteria
- identifies real eval flakiness
- faster than manual log comparison
- useful to at least one team


14. v0.9 — Recipes & Integration Hardening
Purpose
Prepare the library for v1.0 by making it adoptable.
The new v0.9 guide is now correctly added and focuses on runnable recipes, real-world documentation, trace fixtures, conformance tests, feedback integration, migration validation, performance regression testing, and known issues documentation.
Scope
- 10+ runnable recipes
- real-world scenario docs
- trace fixture catalog
- conformance test suite
- documentation cleanup
- user feedback integration
- migration path validation
- performance regression testing
- known issues documentation

Recipes
Ship examples for:
1. RAG pipeline
2. Tool-calling failure and retry
3. Multi-agent handoff
4. Proactive agent logs
5. Vercel AI SDK manual instrumentation
6. OpenAI SDK manual instrumentation
7. NestJS structured logging
8. Retry/fallback pattern
9. Parallel tool calls
10. Error propagation

Fixtures
Create standard fixtures:
minimal-success.jsonl
minimal-error.jsonl
nested-3-levels.jsonl
parallel-siblings.jsonl
llm-with-tokens.jsonl
tool-with-io.jsonl
mixed-confidence.jsonl
long-running.jsonl
multi-agent.jsonl
error-recovery.jsonl

Conformance tests
Start conformance only after real adapter/export contracts exist.
Use this carefully. Do not freeze adapter/sink contracts too early.
Success criteria
- 10+ recipes work
- fixture catalog complete
- docs gaps filled
- migration validated
- P0/P1 feedback addressed
- performance baselines established
- ready for v1.0 stability commitment


15. v1.0 — Stable Local Agent Inspector
Purpose
Declare AgentInspect stable for local TypeScript agent debugging.
The v1.0 guide correctly says v1.0 is a commitment: semver guarantees, deprecation policy, LTS mindset, public API contracts, and schema stability.
Prerequisites
Do not declare v1.0 until:
- v0.3 validated and adopted
- v0.4-v0.8 stable
- v0.9 hardening complete
- 5+ teams using in real workflows
- 6 months without breaking changes
- no open P0 bugs

Stable APIs
Freeze:
export function inspectRun<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T>;

export function step<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T>;

export function observe<T>(target: T): T;

step.llm<T>(name: string, fn: () => Promise<T>): Promise<T>;
step.tool<T>(name: string, fn: () => Promise<T>): Promise<T>;

Be careful with:
step.chain()

Only freeze this if it actually exists and has been used before v1.0.
Stable CLI
Freeze:
agent-inspect list
agent-inspect view
agent-inspect logs
agent-inspect tail
agent-inspect export
agent-inspect diff
agent-inspect clean

Experimental APIs
Mark adapter and sink APIs as experimental in v1.0 unless multiple real integrations validate them.
Node support
Use active LTS versions at v1.0 time.
Recommended:
Node 22
Node 24
Node 20 only if still necessary for users

Do not claim Node 18 official support at v1.0 unless CI proves it and there is a reason.
Release workflow
Use the established process:
pnpm changeset
pnpm changeset version
pnpm build
pnpm test:all
pnpm pack:smoke
git push

Publishing should go through GitHub Actions + npm Trusted Publishing / OIDC, not manual npm publish.

16. Cursor execution model
General Cursor rules
For every Cursor task:
1. Read relevant guide first.
2. Read current source files before editing.
3. Do not assume event names.
4. Do not add dependencies unless explicitly allowed.
5. Implement one phase at a time.
6. Add tests in the same step.
7. Run full validation before moving on.
8. Stop for review after each phase.

Standard validation commands
Run after every meaningful phase:
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm pack:smoke

For CLI features:
node packages/cli/dist/index.cjs --help
node packages/cli/dist/index.cjs list
node packages/cli/dist/index.cjs view <run-id>

For examples:
cd examples/<example>
pnpm install
pnpm start

Cursor prompt style
Use prompts like this:
You are working on AgentInspect.

Read these files first:
- docs/roadmap/CANONICAL-PLAN.md
- docs/roadmap/v0.3-LOG-TO-TREE-CORRECTED.md
- packages/core/src/storage.ts
- packages/core/src/types.ts
- packages/cli/src/index.ts

Task:
Implement only Phase X from the guide.

Constraints:
- Do not add dependencies.
- Use ESM imports.
- Use existing package structure.
- Use actual event names from storage.ts.
- Do not silently infer parent-child relationships.
- Add tests before or with implementation.
- Run pnpm build, typecheck, test, test:all.

Stop after completing this phase and report:
- files changed
- tests added
- commands run
- any deviations from guide


17. Immediate next execution plan
Step 1: Final doc cleanup
Apply the remaining small fixes:
- v0.3 prototype filename: prototype-parser.mjs
- v1.0 Node support consistency
- v1.0 sink note cleanup
- v0.7 future vendor sinks = v1.1+

Step 2: Add canonical summary to project resources
Add this canonical summary as:
docs/roadmap/CANONICAL-POST-MVP-PLAN.md

Step 3: Start the v0.3 spike
Use only examples and prototype parser.
No production code yet.
Step 4: Review spike output manually
Ask:
Would I rather debug from this tree than from raw logs?

If yes, proceed to v0.2 implementation.
If no, reassess before building.
Step 5: Implement v0.2
Use v0.2 as a low-risk warmup and foundation.
Step 6: Implement v0.3 full
Only after spike passes.

18. Final approval
This roadmap is now directionally strong and execution-ready.
The key strategy is right:
Do not compete as a production observability platform.
Do not build a dashboard.
Do not start with adapters.
Do not chase standards first.

Start with the real pain:
developers already have agent logs, but cannot see the execution structure.

Solve that locally, honestly, and safely.

The canonical product mission should be:
AgentInspect helps TypeScript developers understand AI agent execution faster by turning manual traces, structured logs, and framework callbacks into trustworthy local execution trees.

That is the plan I would use as the project-wide reference for the next phase of AgentInspect.