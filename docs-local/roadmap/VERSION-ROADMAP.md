# Version Roadmap

## Purpose

This document gives a concise version-by-version roadmap for AgentInspect after the v0.1 MVP.

It should be used by maintainers and Cursor to understand:

- what each version is for
- what outcome each version should produce
- which versions are implementation-ready
- which versions are planning-only
- which versions require validation before continuing

AgentInspect should move carefully. The core post-MVP direction is promising, but the v0.3 log-to-tree idea must be validated before building heavier features.

---

## Roadmap table

| Version | Theme | Outcome | Risk | Status |
|---|---|---|---|---|
| v0.2 | Local Inspection Pro | Better list/view/clean for existing traces | Low | Implementation-ready |
| v0.3 | Log-to-Tree | Existing logs become local execution trees | High | Spike required first |
| v0.4 | Live Tail | Watch logs as a live tree | Medium | Planning only |
| v0.5 | LangChain Adapter | Official callback-based instrumentation | Medium | Planning only |
| v0.6 | Optional TUI | Keyboard-driven trace inspection | Medium | Planning only |
| v0.7 | Standards Export | OpenInference/OTel-aligned export | Low | Planning only |
| v0.8 | Diff & Compare | Compare runs for eval/debugging | Low | Planning only |
| v0.9 | Recipes & Hardening | Adoption readiness | Low | Planning only |
| v1.0 | Stable Local Agent Inspector | Stable APIs/schema/docs | Low | Future stabilization |

---

## Execution sequence

The sequence is intentionally not a simple linear implementation of v0.2, then v0.3, then v0.4.

The first real action is the v0.3 spike.

```text
Step 0: Run v0.3 spike only
Step 1: If spike passes, implement v0.2
Step 2: Then implement full v0.3
Step 3: Validate v0.3 with real logs and developer feedback
Step 4: Only then continue to v0.4+
Why v0.3 spike comes first

The main post-MVP pivot is structured log-to-tree reconstruction.

This must be validated before investing in:

production parsers
live tail
LangChain adapter
optional TUI
standards export
diff engine
recipe catalog

The spike answers:

Does a local log-to-tree view help understand a real agent run faster than raw logs?

If yes, the roadmap continues.

If no, the product direction must be reassessed.

Version details
v0.2 — Local Inspection Pro
Goal

Improve existing v0.1 trace inspection before full log ingestion.

Outcome

Developers can find, filter, summarize, view, and clean local traces more easily.

Scope summary
list --status
list --name
list --since
list --limit
list --json

view --summary
view --verbose
view --json
view --errors-only
view --metadata

clean --older-than
clean --keep
clean --dry-run

AGENT_INSPECT_TRACE_DIR
Implementation readiness

Ready to implement after the v0.3 spike passes.

Risk

Low.

This version builds on existing manual traces and CLI behavior.

Main risk

Incorrect metadata extraction if Cursor assumes event names instead of inspecting current schema.

Non-negotiables
Use actual event names from storage.ts/tests.
Do not assume run_ended or step_ended.
Do not default unknown status to success.
Do not add cli-table3.
Clean command must verify traces before deleting.
v0.3 — Log-to-Tree
Goal

Parse structured logs into local execution trees or grouped timelines.

Outcome

Developers can point AgentInspect at logs they already have and understand what happened in an agent run.

Scope summary
JSON log parser
log4js best-effort parser
LogIngestConfig
EventNormalizer
Redactor
TreeBuilder
CLI logs command
summary output
JSON output
warnings none/summary/all
examples/06-log-to-tree
Implementation readiness

Spike required first.

Full implementation is not allowed until the spike validates the direction.

Risk

High.

This is the core value validation version.

Main risk

The generated tree may be no better than raw logs, or worse, may imply false parent-child relationships.

Non-negotiables
JSON logs first-class.
log4js text best-effort.
No eval.
No JavaScript object string parsing.
Flat timeline by default.
Confidence labels mandatory.
Do not nest by timestamp alone.
Duration only when explicit or safely paired.
Redaction required.
v0.4 — Live Tail
Goal

Watch logs as a live tree while an app runs.

Outcome

Developers can pipe app logs or tail a file and see a live execution timeline in the terminal.

Scope summary
stdin stream reader
file tail reader
incremental parse
active run grouping
compact display
throttled rendering
Ctrl+C partial save
non-interactive fallback
Implementation readiness

Planning only.

Do not implement until v0.3 is validated.

Risk

Medium.

Streaming and terminal rendering can introduce complexity.

Main risk

The feature may freeze, flicker, or become less useful than raw logs if the parser/tree model is not stable.

Non-negotiables
Reuse v0.3 parser/normalizer/tree builder.
Do not duplicate parsing logic.
No Ink/TUI in v0.4.
Fallback for non-interactive terminals.
v0.5 — LangChain Adapter
Goal

Auto-instrument LangChain.js agents using official callback APIs.

Outcome

LangChain users can get higher-confidence traces with one callback.

Scope summary
@agent-inspect/langchain package
AgentInspectCallback
LLM start/end/error
Tool start/end/error
Chain start/end/error
Agent action/end
parentRunId mapping
token usage metadata
AsyncLocalStorage bridge
Implementation readiness

Planning only.

Do not implement before log-to-tree proves useful.

Risk

Medium.

LangChain callback API surface and async context propagation can be tricky.

Main risk

Adapter complexity may distract from the more universal log-to-tree path.

Non-negotiables
No monkey-patching.
No auto import.
No cost calculation.
No full prompt/output capture by default.
Keep LangChain dependency out of the main package if peer deps are required.
v0.6 — Optional TUI
Goal

Provide keyboard-driven inspection for complex traces.

Outcome

Developers can navigate large traces locally with expand/collapse and metadata panels.

Scope summary
@agent-inspect/tui package
Ink-based UI
keyboard navigation
expand/collapse
metadata panel
error navigation
help screen
simple CLI fallback
Implementation readiness

Planning only.

Do not implement before simple CLI output proves insufficient.

Risk

Medium.

Terminal compatibility and TUI dependency size can become a maintenance burden.

Main risk

TUI can overcomplicate the project and bloat the core package.

Non-negotiables
Separate package only.
Do not add Ink or React to main package.
Simple CLI remains default.
Non-interactive fallback required.
v0.7 — Standards Export
Goal

Export AgentInspect traces to standards-aligned formats.

Outcome

Developers can export local traces to OpenInference-compatible and OTLP JSON formats.

Scope summary
OpenInference JSON export
OTLP JSON export
Markdown export
HTML export
schema validation
Phoenix import testing
Implementation readiness

Planning only.

Do not implement before the internal event model stabilizes.

Risk

Low to medium.

The transformation is read-only, but compatibility claims must be honest.

Main risk

Overclaiming standards/vendor compatibility before testing.

Non-negotiables
Use “OpenInference-compatible”.
Use “OTel GenAI-aligned”.
Do not claim every OTel backend works.
Vendor-specific sinks are v1.1+.
No live vendor streaming before v1.0.
v0.8 — Diff & Compare
Goal

Compare two agent runs for eval and regression debugging.

Outcome

Developers can identify where two runs diverged.

Scope summary
diff run_a run_b
structure comparison
output comparison
timing comparison
error comparison
first divergence
side-by-side renderer
JSON output
Implementation readiness

Planning only.

Requires stable run tree model.

Risk

Low.

This is read-only analysis.

Main risk

Comparison can become too ambitious if it tries to replay or statistically analyze many runs.

Non-negotiables
No replay.
No automatic reruns.
No cassette recording/playback.
No multi-run statistics in v0.8.
v0.9 — Recipes & Integration Hardening
Goal

Prepare the project for v1.0 adoption.

Outcome

Developers have enough recipes, fixtures, docs, and validated workflows to adopt AgentInspect confidently.

Scope summary
10+ runnable recipes
real-world scenario docs
trace fixture catalog
conformance test suite
documentation cleanup
feedback integration
migration validation
performance baselines
known issues
Implementation readiness

Planning only.

Should happen after v0.3-v0.8 validate.

Risk

Low.

Most work is documentation, examples, fixtures, and hardening.

Main risk

Freezing adapter or sink contracts too early.

Non-negotiables
Do not add new major features.
Do not introduce breaking schema changes.
Do not freeze experimental adapter/sink APIs prematurely.
v1.0 — Stable Local Agent Inspector
Goal

Declare AgentInspect stable for local TypeScript agent debugging.

Outcome

Stable APIs, stable schema, stable CLI, strong docs, and cross-platform confidence.

Scope summary
stable inspectRun/step/observe APIs
stable log-to-tree CLI
stable JSONL schema
stable InspectEvent/InspectRunTree contracts
stable CLI list/view/logs/tail/export/diff/clean
migration guide
contributing guide
performance benchmarks
security audit
cross-platform CI
Implementation readiness

Future stabilization only.

Risk

Low if previous versions are validated.

Main risk

Declaring stability too early.

Non-negotiables
Do not declare v1.0 until v0.3 is adopted.
Do not declare v1.0 with open P0 bugs.
Do not freeze adapter/sink APIs unless validated.
Node 18 should not be official unless CI proves it and there is a strong reason.
Version dependencies
v0.3 spike gates the roadmap.
v0.2 should happen after spike passes.
v0.3 full depends on spike success.
v0.4 depends on v0.3 parser/tree stability.
v0.5 depends on proof that better attribution is valuable.
v0.6 depends on simple CLI becoming limiting.
v0.7 depends on stable event model.
v0.8 depends on stable run tree model.
v0.9 depends on real user feedback.
v1.0 depends on adoption and stability.
Implementation status labels

Use these labels consistently:

Implementation-ready
Spike required first
Planning only
Future stabilization
Deferred
Archived
Current status
v0.2: Implementation-ready, but only after v0.3 spike passes
v0.3: Spike required first
v0.4-v0.9: Planning only
v1.0: Future stabilization
Current next step

Create canonical docs, then start:

examples/06-log-to-tree/

No production code should be written before the docs and spike.