# AgentInspect Roadmap

## Purpose

This roadmap defines the post-MVP direction for AgentInspect.

AgentInspect has already completed its v0.1 MVP as a local TypeScript tracing library using:

```ts
import { inspectRun, step, observe } from "agent-inspect";

The next phase moves AgentInspect from manual tracing only toward a broader but still focused product direction:

AgentInspect is a local-first execution-tree debugging tool for TypeScript AI systems.

The strongest post-MVP wedge is:

Turn structured agent logs into trustworthy local execution trees.

This roadmap exists so contributors, Cursor, and future planning threads follow the same execution sequence and do not drift into premature dashboards, SaaS observability, vendor sinks, or framework-specific complexity.

Product direction

AgentInspect should help TypeScript developers understand what their AI agents did step by step using data they already have:

manual inspectRun() traces
step() instrumentation
structured JSON logs
log4js-style logs with embedded JSON
future framework callbacks
future standards-aligned trace exports

The default workflow must remain local-first:

no account required
no SaaS backend
no hosted dashboard
no Docker stack
no vendor API key
no cloud ingestion required

AgentInspect is not trying to become LangSmith, Langfuse, Braintrust, New Relic, Datadog, or a general observability platform. It should stay focused on local developer debugging.

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

The unusual order is intentional.

The v0.3 log-to-tree spike must happen before full production implementation because it validates the core product pivot. If local log-to-tree output does not help developers debug faster than raw logs, later features such as live tail, adapters, TUI, and exports will not fix the core problem.

Execution order

Follow this order:

1. Create canonical docs.
2. Run the v0.3 log-to-tree spike.
3. If the spike passes, implement v0.2.
4. Then implement full v0.3.
5. Validate v0.3 with real logs and at least 2 developers.
6. Only then consider v0.4 Live Tail.
7. Continue version by version only after each go/no-go gate passes.

Do not skip the spike.

Do not start with adapters.

Do not start with TUI.

Do not start with standards export.

Do not build vendor sinks before local value is proven.

Step 0 — v0.3 spike only
Goal

Validate whether turning structured agent logs into a local execution tree or grouped timeline is actually useful.

The spike answers one question:

Would I rather debug from this AgentInspect tree than from raw logs?

Required example folder
examples/06-log-to-tree/
  sample-json.log
  sample-log4js.log
  agent-inspect.logs.json
  expected-output.txt
  prototype-parser.mjs
  README.md
Spike constraints
Use dependency-free JavaScript.
Use prototype-parser.mjs, not TypeScript.
Do not require tsx.
Do not add production modules.
Do not add runtime dependencies.
Do not silently infer parent-child relationships.
Flat timeline by default.
Confidence labels required.
Go criteria

Proceed if:

output is clearer than raw logs
confidence labels make sense
grouped timeline helps explain the run
errors and slow steps are visible
log4js best-effort parsing is acceptable
No-go criteria

Reassess if:

output is no better than raw logs
config is too hard
tree implies relationships that are not true
logs do not contain enough useful structure
v0.2 — Local Inspection Pro
Theme

Improve existing local trace inspection before introducing production log ingestion.

Outcome

Existing v0.1 traces become easier to find, summarize, filter, view, and clean.

Scope
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

Also support:

AGENT_INSPECT_TRACE_DIR=./traces agent-inspect list
Important rules
Use actual current JSONL event names from source.
Do not assume run_ended or step_ended.
Do not default unknown status to success.
Do not add cli-table3.
Use a small internal table renderer.
Clean command must verify AgentInspect traces before deleting.
Status

Implementation-ready.

v0.3 — Log-to-Tree
Theme

Parse existing structured logs into local execution trees or grouped timelines.

Outcome

Developers can point AgentInspect at logs they already have and understand what the agent did.

Scope
agent-inspect logs ./agent.log --format json
agent-inspect logs ./agent.log --format log4js
agent-inspect logs ./agent.log --config agent-inspect.logs.json
agent-inspect logs ./agent.log --run-id-key decisionId
agent-inspect logs ./agent.log --event-key event
agent-inspect logs ./agent.log --json
agent-inspect logs ./agent.log --summary
agent-inspect logs ./agent.log --warnings summary
agent-inspect logs ./agent.log --warnings all
Key rules
JSON logs are first-class.
log4js text logs are best-effort.
Parse embedded valid JSON only.
Do not use eval.
Do not parse JavaScript object strings.
Flat timeline by default.
Nest only with explicit parentId or config-declared parent.
Confidence labels are mandatory.
Duration only when explicit or safely paired.
Redaction is required.
Status

Spike required first. Full implementation happens only after the spike passes.

v0.4 — Live Tail
Theme

Watch agent logs as a live tree while the application runs.

Outcome

Developers can run their app and see an updating execution timeline in the terminal.

Example commands
npm run dev 2>&1 | agent-inspect tail --format log4js

agent-inspect tail --file ./logs/agent.log --format json

agent-inspect tail \
  --file ./logs/agent.log \
  --config agent-inspect.logs.json

agent-inspect tail --run-id decisionId=01fe6bf1
agent-inspect tail --refresh 100
In scope
stdin stream reader
file tail reader
incremental parse
active run grouping
compact multi-run display
throttled rendering
Ctrl+C partial trace save
non-interactive fallback
Out of scope
Ink TUI
keyboard navigation
expand/collapse
replay
diff
split-panel multi-run display
Status

Planning only.

Do not implement until v0.3 is validated.

v0.5 — LangChain Adapter
Theme

Auto-instrument LangChain.js agents through official callbacks.

Outcome

LangChain users can add one callback and get higher-confidence traces than log parsing alone.

Package direction
npm install agent-inspect @agent-inspect/langchain
Example API
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
In scope
BaseCallbackHandler implementation
LLM start/end/error
tool start/end/error
chain start/end/error
agent action/end
parentRunId mapping
token usage metadata when available
AsyncLocalStorage bridge to inspectRun
Out of scope
monkey-patching
auto import
Vercel AI SDK adapter
Mastra adapter
NestJS module
cost calculation
full prompt/output capture by default
Status

Planning only.

Do not implement before log-to-tree proves value.

v0.6 — Optional TUI
Theme

Keyboard-driven interactive tree inspection.

Outcome

Developers with larger traces can navigate locally without changing the default CLI experience.

Package direction
npm install @agent-inspect/tui
CLI
agent-inspect view run_abc123 --tui
In scope
separate optional package
Ink-based UI
keyboard navigation
expand/collapse
metadata panel
error navigation
help screen
fallback to simple output
Out of scope
mouse support
themes
live updating TUI
multi-run panels
prompt editing
replay/fork
Status

Planning only.

Do not add TUI dependencies to the main package.

v0.7 — Standards Export
Theme

Export local AgentInspect traces to standards-aligned formats.

Outcome

Developers can export local traces to OpenInference-compatible or OTLP JSON formats without changing agent code.

CLI
agent-inspect export run_abc123 --format openinference
agent-inspect export run_abc123 --format otlp-json
agent-inspect export run_abc123 --format markdown > run.md
agent-inspect export run_abc123 --format html > run.html
agent-inspect export run_abc123 --format openinference -o trace.json
agent-inspect export run_abc123 --format openinference --validate
Compatibility language

Use:

OpenInference-compatible
OTel GenAI-aligned
Tested against Phoenix
OTLP JSON experimental until verified

Avoid:

Works with every observability backend
Guaranteed Langfuse/Braintrust/New Relic support
Out of scope
live vendor streaming
vendor-specific sinks
OTLP gRPC
custom span processors
production deployment guides
Status

Planning only.

Vendor-specific sinks are v1.1+ territory.

v0.8 — Diff & Compare
Theme

Compare two runs for eval and regression debugging.

Outcome

Developers can compare passing and failing agent runs and find the first divergence.

CLI
agent-inspect diff run_a run_b
agent-inspect diff run_a run_b --ignore-duration
agent-inspect diff run_a run_b --focus errors
agent-inspect diff run_a run_b --json
agent-inspect diff run_a run_b --check structure
agent-inspect diff run_a run_b --check outputs
agent-inspect diff run_a run_b --check all
In scope
compare two runs
structure comparison
output comparison
timing comparison
error comparison
first divergence
side-by-side renderer
JSON output
Out of scope
replay
automatic reruns
cassette recording/playback
multi-run statistical analysis
time-travel debugging
Status

Planning only.

v0.9 — Recipes & Integration Hardening
Theme

Real-world examples, adoption hardening, and pre-v1.0 polish.

Outcome

AgentInspect becomes easier to adopt through examples, fixtures, docs, and validated integration paths.

In scope
10+ runnable recipes
real-world scenario docs
trace fixture catalog
conformance test suite
documentation cleanup
user feedback integration
migration path validation
performance regression testing
known issues documentation
Recipes
RAG pipeline
Tool-calling failure and retry
Multi-agent handoff
Proactive agent logs
Vercel AI SDK manual instrumentation
OpenAI SDK manual instrumentation
NestJS structured logging
Retry/fallback pattern
Parallel tool calls
Error propagation
Status

Planning only.

Do not implement before v0.3-v0.8 validate.

v1.0 — Stable Local Agent Inspector
Theme

Stabilize the local debugging workflow.

Outcome

AgentInspect declares stable APIs, stable CLI, stable schema, strong documentation, and cross-platform confidence.

Do not declare v1.0 until
v0.3 validated and adopted
v0.4-v0.8 stable
v0.9 hardening complete
5+ teams using in real workflows
6 months without breaking changes
no open P0 bugs
Stable APIs
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

Only freeze step.chain() if it actually exists and is used before v1.0.

Stable CLI
agent-inspect list
agent-inspect view
agent-inspect logs
agent-inspect tail
agent-inspect export
agent-inspect diff
agent-inspect clean
Experimental at v1.0
adapter APIs
sink APIs

These interfaces are experimental because only one adapter exists and zero production sinks exist in v1.0.

Node support direction

Use active LTS versions at v1.0 time:

Node 22
Node 24
Node 20 only if still necessary for users

Do not claim Node 18 official support at v1.0 unless CI proves it and there is a strong reason.

Current priority

The current priority is not implementation.

The current priority is:

1. Create canonical docs.
2. Commit docs.
3. Run the v0.3 spike.
4. Review the spike output.
5. If the spike passes, implement v0.2.
6. Then implement full v0.3.
Cursor reminder

Every implementation prompt should start by reading:

docs/strategy/CANONICAL-POST-MVP-PLAN.md
docs/implementation/CURSOR-RULES.md
docs/roadmap/GO-NO-GO-GATES.md
docs/prd/<current-version>.md
docs/implementation/<current-guide>.md
current source files related to the task

Cursor must follow the canonical plan over archived or older exploratory notes.