# AgentInspect Roadmap — v3.5.3 to v7

**Status:** Canonical implementation roadmap proposal after the v3.5 adoption train  
**Audience:** Maintainers, Cursor sessions, contributors, adapter authors, and design partners  
**Current baseline:** `agent-inspect@3.5.3`  
**Roadmap horizon:** v3.5.4 → v4 → v5 → v6 → conditional v7  
**Primary goal:** Move from a broad local toolkit to a focused, adoption-ready local and self-hosted trace workspace for TypeScript AI agents.

---

## 1. Executive summary

AgentInspect has already reached the point where the core product is broad enough. The next phase should not chase random new features. The next phase should make AgentInspect easier to adopt, easier to operate in real projects, and easier for contributors to extend.

The product should evolve from:

```text
Local execution-tree debugger for TypeScript AI agents
```

to:

```text
Customer-owned local and self-hosted evidence workspace for TypeScript AI agent behavior
```

The strongest product sentence is:

> AgentInspect helps TypeScript teams trace what happened, check what should have happened, redact what must not leave the machine, and share local evidence without adopting a hosted observability platform.

The next large direction is not “SaaS.” It is **Local Studio**:

```text
workspace manifest
local trace index
sessions/activity
shareable trace bundles
observed outcomes
trace suites
CI quality gates
self-hosted internal analyzer
read-only MCP context
standards graduation
```

The boundary remains strict:

- no maintainer-hosted cloud
- no default upload
- no vendor telemetry pipeline by default
- no prompt registry
- no dataset platform
- no cost platform
- no production replay engine
- no automatic remediation
- no broad shallow adapter matrix

---

## 2. Current v3.5.3 baseline

AgentInspect now includes a broad package family and local workflow surface.

Current product areas include:

- core CLI and trace model
- local JSONL trace capture
- stable schema 1.0 line
- v0.1 / v0.2 compatibility
- `observe`, `inspectRun`, `maybeInspectRun`, `step`, `createInspector`
- reader and writer subpaths
- OpenInference / OTLP-style local read and export flows
- `what`, `report`, `timeline`, `stats`, `search`, `diff`
- deterministic checks
- safe-sharing commands
- eval utilities
- reusable redaction utilities
- AI SDK adapter
- OpenAI Agents adapter
- LangChain / LangGraph-through-LangChain adapter path
- harness package
- Vitest/Jest reporters
- MCP client tracing
- read-only MCP server
- guardrails and circuit utilities
- local viewer
- VS Code surface
- adapter SDK
- adoption docs, starters, demo scripts, and presentation assets

The product is now feature-rich enough. The next roadmap should focus on **workspace-level adoption** and **contributor-friendly extension**, not more disconnected surfaces.

---

## 3. North star

The north star for v4–v6:

> A team can initialize an AgentInspect workspace, run local agent traces, inspect sessions, compare regressions, verify safety, export share-safe evidence, and optionally self-host an internal analyzer — all without sending data to AgentInspect or any maintainer-operated service.

The north star for contributors:

> A contributor can add a fixture, example, adapter, check, renderer, or docs improvement without touching core schema, release machinery, or safety internals.

---

## 4. Product principles

### 4.1 Local-first by default

AgentInspect must continue to work fully with local files and local commands.

Default behavior:

```text
local JSONL
local reports
local checks
local bundles
local viewer
local index
no upload
```

### 4.2 Customer-owned self-hosting only

Future team workflows may include self-hosted components, but not a maintainer-hosted cloud.

Allowed:

```text
localhost viewer
self-hosted studio
customer-owned Postgres
customer-owned artifact import
internal MCP server
```

Not allowed:

```text
AgentInspect-hosted SaaS
multi-tenant cloud dashboard
default remote collector
vendor sink matrix in core
```

### 4.3 JSONL remains source of truth

Indexes, databases, caches, summaries, and reports are derived artifacts.

```text
JSONL trace files are durable.
Indexes are rebuildable.
Reports are regenerable.
Bundles are exported copies.
```

### 4.4 Safety is a product feature

Safe-sharing and redaction are not secondary. They are central to adoption.

Required pattern:

```text
capture policy
redaction profile
scan
verify-safe
share-safe bundle
```

### 4.5 Standards are bridges, not the core dependency

OpenInference and OpenTelemetry compatibility are important, but core must not require an OTel SDK or collector.

Allowed:

```text
OpenInference mapping
OTLP JSON export
optional OTLP exporter
Phoenix/Langfuse/New Relic/Datadog/Honeycomb graduation docs
```

Not allowed:

```text
OTel SDK in root
vendor SDK matrix in core
claiming full universal backend compatibility
```

### 4.6 Contributors should start with edges, not core

Good contributor work:

```text
docs
fixtures
recipes
starter examples
adapter SDK examples
renderer examples
performance fixtures
VS Code polish
standards examples
```

Maintainer-owned work:

```text
schema changes
root exports
redaction engine behavior
official adapter contracts
package release machinery
security boundaries
```

---

## 5. Roadmap overview

```text
v3.5.4  Source-of-truth and OSS roadmap cleanup
v4.0    Local Trace Workspace
v4.1    Optional Local Index
v4.2    Sessions and Activity
v4.3    Shareable Trace Bundles
v4.4    Observed Outcomes
v5.0    Trace Suite Config
v5.1    Cohort Analysis v2
v5.2    CI Quality Gates
v5.3    Suite Viewer
v5.4    PM/QA Eval Templates
v6.0    Self-hosted Studio
v6.1    Client-hosted Ingestion
v6.2    Plugin Convention
v6.3    MCP and Coding-agent Workflows
v6.4    Standards Graduation
v7.0    Conditional Ecosystem and Intelligence Layer
```

---

# v3.5.4 — Source-of-truth and OSS Roadmap Cleanup

## Goal

Make the public repo, docs, roadmap, and contributor surface agree with the v3.5.3 product state before any larger v4 work begins.

## Why this matters

AgentInspect has moved quickly. The code and package family are ahead of older issue batches and roadmap text. Contributors should not have to infer which roadmap is current.

## Scope

### Public source-of-truth cleanup

Update:

```text
README.md
ROADMAP.md
CHANGELOG.md
GOOD-FIRST-ISSUES.md
CONTRIBUTING.md
docs/README.md
docs/ADOPTION.md
docs/community/*
docs/implementation/RELEASE-TRAIN-STATE.md
```

Required changes:

```text
- Current release = 3.5.3 or 3.5.4 after patch.
- Mark v3.1–v3.5 trains completed.
- Replace stale “Now” sections with “Now: OSS contribution and v4 workspace planning.”
- Move old v1/v2 roadmap details into archive links.
- Add concise contributor roadmap.
- Add issue triage table: keep / refresh / close.
```

### Open issue cleanup plan

Create a maintainer task list for existing issues:

```text
Close as stale/completed:
- old timeline proposal
- old stats proposal
- pre-adapter Vercel AI SDK design note
- pre-CI artifact recipe if already shipped

Refresh:
- OpenInference fixture
- Phoenix/OpenInference recipe
- LangChain persisted trace example
- decision metadata recipe
- log ingest cookbook
- tool failure retry fixture

Create new:
- minimal adapter SDK example
- VS Code sample trace command
- performance fixture pack
- extension submission template
- first PR walkthrough if missing
```

### Contributor lane documentation

Add or update:

```text
docs/community/OSS-ROADMAP.md
docs/community/FIRST-PR-WALKTHROUGH.md
docs/community/CONTRIBUTOR-LANES.md
```

Contributor lanes:

```text
1. Docs and first-use clarity
2. Fixtures and examples
3. Adapter SDK examples
4. VS Code and UI polish
5. Performance and scale fixtures
6. Standards graduation docs
```

## Non-goals

```text
No runtime changes
No package API changes
No new adapters
No schema changes
No release automation changes
```

## Validation

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Release type

Patch release if public docs are corrected.

## Success criteria

```text
- README, ROADMAP, CHANGELOG, package manifests agree.
- Contributors see current work, not stale v1/v2 issues.
- GOOD-FIRST-ISSUES.md only lists valid issues.
- ROADMAP.md points to v4 workspace direction.
```

---

# v4 — AgentInspect Local Trace Workspace

## Product theme

Move from command collection to project-local trace workspace.

## v4 goal

A user should be able to run:

```bash
npx agent-inspect init
npx agent-inspect doctor
npx agent-inspect workspace status
npx agent-inspect workspace index
npx agent-inspect workspace open
npx agent-inspect sessions latest
npx agent-inspect search "refund tool failed"
npx agent-inspect bundle --session <sessionId> --profile share
```

and understand the state of the project’s local agent traces.

## Why v4 matters

At v3.5, AgentInspect has many powerful commands and packages. v4 should organize them around a durable local workspace:

```text
runs
sessions
reports
artifacts
bundles
index
notes
```

This makes AgentInspect feel less like a toolbox and more like a coherent local workbench.

---

## v4.0.0 — Workspace Manifest and Layout

### Goal

Introduce a stable local workspace layout and manifest.

### Add `.agent-inspect/workspace.json`

Example:

```json
{
  "schemaVersion": "1.0",
  "project": "support-agent",
  "createdAt": "2026-07-08T00:00:00.000Z",
  "traceDirs": ["runs"],
  "reportsDir": "reports",
  "artifactsDir": "artifacts",
  "bundlesDir": "bundles",
  "notesDir": "notes",
  "redactionProfile": "share",
  "index": {
    "enabled": false,
    "type": "none"
  }
}
```

### Recommended layout

```text
.agent-inspect/
  workspace.json
  runs/
  reports/
  artifacts/
  bundles/
  index/
  notes/
```

### Commands

```bash
agent-inspect workspace init
agent-inspect workspace status
agent-inspect workspace doctor
agent-inspect workspace clean
agent-inspect workspace path
```

### Behaviors

```text
workspace init
  Creates workspace.json and folders.
  Does not delete existing traces.
  Detects existing trace directories.

workspace status
  Shows trace counts, sessions, reports, artifacts, bundle count, index status.

workspace doctor
  Validates folder permissions, config shape, trace readability, stale index status.

workspace clean
  Dry-run by default.
  Never deletes traces without explicit confirmation.
```

### Types

```ts
interface AgentInspectWorkspaceManifest {
  schemaVersion: "1.0";
  project: string;
  createdAt: string;
  traceDirs: string[];
  reportsDir: string;
  artifactsDir: string;
  bundlesDir: string;
  notesDir: string;
  redactionProfile: "local" | "share" | "strict";
  index: {
    enabled: boolean;
    type: "none" | "sqlite" | "custom";
    path?: string;
  };
}
```

### Non-goals

```text
No daemon
No database dependency
No cloud sync
No hosted account
No migration of existing traces by default
```

### Tests

```text
workspace manifest validation
existing directory detection
permission failure handling
clean dry-run behavior
workspace status JSON output
backward compatibility with old trace dirs
```

### Validation

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm fixtures:check
pnpm recipes:check
pnpm pack:smoke
pnpm compat:smoke
```

### Success criteria

```text
A new project can create a workspace.
An existing .agent-inspect directory can be adopted without rewriting traces.
Workspace commands are read-only unless explicitly confirmed.
```

---

## v4.1.0 — Optional Local Index

### Goal

Make local search, stats, sessions, and cohort workflows fast enough for real project trace directories.

### Package

```text
@agent-inspect/index-sqlite
```

### Why optional

The root package should remain lightweight. SQLite is useful, but it should not enter root dependencies.

### Commands

```bash
agent-inspect index build
agent-inspect index rebuild
agent-inspect index status
agent-inspect index search "refund policy failed"
agent-inspect index query --tool retrievePolicy
agent-inspect index query --status error
agent-inspect index clean
```

### Indexed fields

```text
runId
sessionId
correlationId
decisionId
jobId
groupId
timestamp
kind
name
status
toolName
model
provider
error.message
observation.status
decision.reasonLabel
source.type
source.framework
adapter package
trace file path
report path
bundle path
```

### Design rules

```text
JSONL remains source of truth.
Index is rebuildable.
Index is disposable.
Index is local.
Index is opt-in.
No background daemon by default.
No semantic/vector search in v4.1.
No remote service.
```

### Schema proposal

```sql
runs(run_id, session_id, status, started_at, ended_at, duration_ms, source_file)
events(event_id, run_id, parent_id, kind, name, status, timestamp, duration_ms)
attributes(event_id, key, value_json)
errors(event_id, run_id, message, code)
sessions(session_id, started_at, ended_at, status, run_count)
artifacts(run_id, type, path, created_at)
```

### Tests

```text
index build from v1.0 traces
index rebuild idempotency
index delete
stale index detection
query by status/kind/tool/session
large fixture index performance
index corruption recovery
```

### Performance benchmarks

```text
1k events
10k events
100k events
1k runs
10k runs
```

### Success criteria

```text
Index can be rebuilt from trace files.
Index improves search/stats/session query speed.
Index is not required for core CLI use.
No root dependency is added.
```

---

## v4.2.0 — Sessions and Activity

### Goal

Make sessions, conversations, retries, attempts, handoffs, and activity first-class local concepts.

### Commands

```bash
agent-inspect sessions
agent-inspect sessions latest
agent-inspect sessions activity --since 7d
agent-inspect sessions show <sessionId>
agent-inspect sessions handoffs
agent-inspect sessions errors
```

### Session status model

```text
running
waiting_input
idle
completed
error
stale
unknown
```

### Session fields

```text
sessionId
runIds
status
startedAt
endedAt
durationMs
correlationId
jobId
workflowId
lastError
lastActivity
handoffs
attempts
retryCount
observationSummary
checkSummary
```

### Activity output

```text
Today
  support-agent session abc123 failed at refund-policy tool
  browser-agent session def456 completed with observation warning

Last 7 days
  42 sessions
  6 failed
  3 stale
  8 guardrail warnings
```

### Rules

```text
Do not infer relationships from timestamps alone.
Use explicit sessionId/groupId/correlationId/jobId where present.
Use confidence labels for inferred grouping.
Unknown relationships remain visible.
```

### Tests

```text
session grouping by explicit sessionId
session grouping by correlationId
handoff representation
retry attempt grouping
stale session detection
activity summary rendering
JSON output
```

### Success criteria

```text
A developer can understand multi-run agent activity without manually opening every trace.
Handoffs and retries are visible.
No fake parent-child relationships are invented.
```

---

## v4.3.0 — Shareable Trace Bundles

### Goal

Create safe, offline, PR-friendly evidence bundles.

### Commands

```bash
agent-inspect bundle <runId> --profile share
agent-inspect bundle --session <sessionId> --profile share
agent-inspect bundle --since 24h --profile strict
agent-inspect bundle --out ./agent-inspect-bundle.zip
```

### Bundle contents

```text
trace.html
trace.jsonl
summary.md
metadata.json
check-results.json
eval-results.json
redaction-report.json
performance-summary.json
assets/
```

### Default safety

```text
profile = share
verify-safe runs automatically
bundle fails on UNSAFE unless --allow-unsafe is passed
original traces are not mutated
```

### Metadata

```json
{
  "createdAt": "2026-07-08T00:00:00.000Z",
  "agentInspectVersion": "4.3.0",
  "redactionProfile": "share",
  "sourceTraceCount": 1,
  "safeStatus": "SAFE_WITH_WARNINGS"
}
```

### Tests

```text
bundle creation
strict profile application
unsafe failure behavior
allow-unsafe override
zip/tar output if implemented
single-folder output
report opens offline
no mutation of original traces
```

### Success criteria

```text
A developer can attach a bundle to a PR or issue.
A teammate can open it offline.
The bundle explains what was redacted and what remains.
```

---

## v4.4.0 — Observed Outcomes

### Goal

Track whether the external world changed as expected, not only whether an agent tool returned success.

### Why

Agents often interact with side-effecting systems:

```text
browser state
database rows
queue jobs
files
network calls
MCP tools
workflow status
```

A tool returning `ok` does not prove the outcome happened.

### Model

```ts
interface ObservedOutcome {
  name: string;
  expectation: string;
  status: "passed" | "failed" | "unknown" | "skipped";
  method?:
    | "dom"
    | "accessibility"
    | "snapshot"
    | "network"
    | "storage"
    | "filesystem"
    | "database"
    | "queue"
    | "custom";
  actual?: unknown;
  evidence?: unknown;
  observedAt?: string;
}
```

### API

```ts
import { observeOutcome } from "agent-inspect";

await observeOutcome("policyShown", {
  expectation: "Refund policy should be visible",
  status: "passed",
  method: "custom",
  evidence: { selector: "#refund-policy" }
});
```

### CLI

```bash
agent-inspect search --observation failed
agent-inspect report <runId> --section observations
agent-inspect check <runId> --fail-on-observation failed
```

### Tests

```text
outcome event schema
outcome redaction
outcome report section
outcome check rule
failed observation fixture
unknown observation fixture
```

### Success criteria

```text
AgentInspect can distinguish tool success from real-world outcome success.
Observed outcomes appear in reports, checks, bundles, and sessions.
```

---

# v5 — Trace Suites and Local Regression Evaluation

## Product theme

Turn AgentInspect into the local trajectory-evaluation layer for TypeScript agents.

## v5 goal

A team should be able to define trace suites, run them locally or in CI, compare baseline/candidate behavior, and hand PM/QA a readable report without adopting a hosted eval platform.

---

## v5.0.0 — Trace Suite Config

### Add `agent-inspect.suite.ts`

Example:

```ts
export default {
  name: "refund-agent",
  traces: "./.agent-inspect/runs",
  cases: [
    {
      id: "refund-basic",
      input: "./fixtures/refund-basic.json",
      requireTools: ["retrievePolicy"],
      forbidTools: ["deleteAccount"],
      maxDurationMs: 5000,
      expectedObservations: ["policyShown"]
    }
  ]
};
```

### Commands

```bash
agent-inspect suite init
agent-inspect suite run
agent-inspect suite list
agent-inspect suite report
agent-inspect suite validate
```

### Config fields

```text
name
traces
cases
checks
eval rules
redaction profile
artifact output
baseline path
candidate path
```

### Tests

```text
config loading
config validation
missing trace handling
suite run summary
suite report generation
safe artifact generation
```

### Non-goals

```text
No hosted dataset platform
No prompt registry
No LLM judge by default
No cloud sync
```

---

## v5.1.0 — Cohort Analysis v2

### Goal

Compare groups of runs to detect regressions.

### Commands

```bash
agent-inspect cohort --baseline before --candidate after
agent-inspect cohort --group-by model
agent-inspect cohort --group-by metadata.promptVersion
agent-inspect cohort --metric errorRate,duration,toolChoice,observationFailure
```

### Metrics

```text
failure rate
duration
tool choice
tool ordering
LLM call count
token usage
retry count
observation failure
guardrail failure
circuit violation
redaction warning
```

### Outputs

```text
cohort-summary.md
cohort-results.json
cohort-report.html
```

### Tests

```text
baseline/candidate grouping
tool choice drift
duration regression
token regression
observation failure rate
JSON output
HTML report
```

### Success criteria

```text
A developer can see whether a prompt/model/tool change made the agent worse across many traces.
```

---

## v5.2.0 — CI Quality Gates

### Goal

Make AgentInspect a deterministic CI gate for agent behavior.

### Commands

```bash
agent-inspect gate --suite agent-inspect.suite.ts
agent-inspect gate --max-error-rate 5
agent-inspect gate --max-p95-duration 10000
agent-inspect gate --forbid-tool deleteAccount
agent-inspect gate --require-observation policyShown
```

### Outputs

```text
gate-results.json
gate-summary.md
gate-report.html
junit.xml
github-step-summary.md
```

### Exit codes

```text
0 passed
1 gate failed
2 invalid config
3 trace read failure
4 unsupported format
```

### Tests

```text
CI pass/fail
Junit output
GitHub step summary output
required observation
forbidden tool
max error rate
max p95 duration
```

### Success criteria

```text
A CI pipeline can fail deterministically on agent behavior with readable evidence.
```

---

## v5.3.0 — Suite Viewer

### Goal

Make suite evidence inspectable by PMs, QA, support engineers, and reviewers.

### Commands

```bash
agent-inspect viewer --suite
agent-inspect viewer --workspace
```

### UI sections

```text
suite list
case status
failure diff
timeline
tool path
observations
guardrails
redaction status
CI artifacts
bundle export
```

### Tests

```text
viewer loads suite fixture
viewer displays failed case
viewer displays check results
viewer displays observation failures
viewer export bundle link
```

### Success criteria

```text
A non-CLI user can understand suite failures from a local viewer.
```

---

## v5.4.0 — PM/QA Eval Templates

### Goal

Provide reusable local trace-suite templates for common AI-agent product scenarios.

### Templates

```text
customer-support-agent
refund-agent
sales-assistant
browser-task-agent
MCP-tool-agent
workflow-agent
RAG-answer-agent
human-approval-agent
```

### Checks included

```text
task completed
correct tool used
forbidden tool not used
retrieval occurred before answer
guardrail passed
observation passed
no excessive retries
duration within budget
safe report generated
```

### Commands

```bash
agent-inspect suite init --template refund-agent
agent-inspect suite init --template mcp-tool-agent
```

### Success criteria

```text
A PM/QA person can review trace-suite evidence without understanding every implementation detail.
```

---

# v6 — Self-hosted Studio and Team Analyzer

## Product theme

Give teams a customer-owned internal analyzer without maintainer infrastructure.

## v6 goal

A team can self-host AgentInspect Studio internally, import CI artifacts, search traces, inspect regressions, expose read-only MCP tools to coding agents, and graduate exports to standards-based observability.

---

## v6.0.0 — Self-hosted Studio

### Commands

```bash
agent-inspect studio
agent-inspect studio --server
agent-inspect studio --db ./.agent-inspect/index.db
agent-inspect studio --db postgres://...
```

### Features

```text
multi-project workspace
trace import
run list
session list
suite results
checks
evals
redaction status
guardrails
circuit warnings
observations
search
diff
reports
bundle export
```

### Security

```text
localhost by default
optional basic auth
optional env password
no maintainer service
no default upload
```

### Tests

```text
localhost startup
workspace load
sqlite mode
postgres mode if implemented
auth enabled
auth disabled localhost
bundle export
read-only route behavior
```

---

## v6.1.0 — Client-hosted Ingestion

### Inputs

```text
HTTP ingest endpoint
file-drop directory
GitHub artifact importer
CI upload token generated by self-hosted instance
manual bundle upload
```

### Rules

```text
Not enabled in root package
Self-hosted only
Explicit install
Security docs required
No public cloud maintained by AgentInspect
```

### Tests

```text
HTTP ingest disabled by default
explicit enable required
token validation
file drop import
GitHub artifact fixture import
safe error messages
```

---

## v6.2.0 — Plugin Convention without Hosted Marketplace

### Package naming convention

```text
agent-inspect-plugin-*
agent-inspect-adapter-*
agent-inspect-renderer-*
agent-inspect-check-*
agent-inspect-importer-*
```

### Commands

```bash
agent-inspect plugins list
agent-inspect plugins doctor
agent-inspect plugins validate <package>
```

### Rules

```text
No automatic remote marketplace
No untrusted code loading by default
Explicit install only
Adapter SDK conformance required
Privacy checklist required
```

### Tests

```text
plugin manifest validation
adapter SDK conformance validation
privacy checklist validation
unsafe plugin warning
```

---

## v6.3.0 — MCP and Coding-agent Workflows

### Goal

Make read-only trace context available to coding agents and local assistants.

### MCP tools

```text
read traces
search indexed traces
summarize failed run
retrieve decision notes
export share-safe bundle
find failed observation
find slowest path
run deterministic checks
```

### Rules

```text
Read-only by default
No code edits
No auto-fix
No replay
No unredacted fields by default
No hidden network behavior
```

### Tests

```text
MCP tool list
read trace
search trace
find first error
run check
export safe bundle
redaction enforcement
read-only enforcement
```

---

## v6.4.0 — Standards Graduation

### Scope

```text
OpenInference fixture validation
OTLP exporter
Langfuse import recipe
Phoenix import recipe
New Relic docs
Datadog docs
Honeycomb docs
OpenTelemetry semantic-convention pinning
```

### Principles

```text
Prefer standards over vendor SDKs
No vendor SDK matrix in core
No default upload
No managed collector
```

### Tests

```text
OpenInference fixture export/import
OTLP JSON validation
semconv mapping snapshot
Phoenix recipe smoke if possible
Langfuse local/self-hosted recipe docs
```

---

# v7 — Conditional Ecosystem and Intelligence Layer

## Status

v7 is conditional. Do not execute v7 unless v4–v6 show real adoption.

## Proceed only if

```text
Teams use workspaces and suites repeatedly.
Self-hosted Studio has real users.
External plugins/adapters appear.
MCP/coding-agent workflows are used.
Users request extension/intelligence features rather than setup help.
```

## v7 possible areas

### Trace intelligence plugins

```text
LLM-assisted explain plugin
local-only explain plugin
workflow analyzer plugins
browser-agent analyzer
MCP analyzer
support-agent analyzer
```

### Context optimization research

```text
@agent-inspect/context
trace-aware context usage
compression decisions as trace events
token-budget checks
no cloud compression service
```

### Browser-agent support

```text
@agent-inspect/browser
@agent-inspect/stagehand
@agent-inspect/playwright
```

### Enterprise packaging

```text
Docker Compose self-hosted bundle
Helm chart if demanded
Postgres mode
internal auth mode
offline docs
air-gapped package instructions
```

### External extension registry

```text
adapter package
conformance status
privacy review
maintainer
supported framework versions
```

## v7 non-goals

```text
No paid cloud
No multi-tenant SaaS
No default telemetry
No cost platform
No prompt registry
No dataset management platform
No automatic remediation
```

---

# Cross-cutting test and validation strategy

## Required validation per train

### Docs-only

```bash
pnpm typecheck
pnpm test
git diff --check
```

### Runtime / CLI

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm test:all
pnpm pack:smoke
pnpm compat:smoke
```

### Fixtures / recipes

```bash
pnpm fixtures:check
pnpm recipes:check
```

### Performance

```bash
pnpm perf:baseline
```

### Release readiness

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

## Regression suites to maintain

```text
old v0.1 traces readable
v0.2 traces readable
schema 1.0 traces readable
workspace adoption of old trace dirs
index rebuild from JSONL
redaction before bundle export
verify-safe enforcement
suite checks deterministic
MCP read-only enforcement
self-hosted studio no upload by default
```

---

# Cursor execution model

## Chunk policy

Each implementation prompt should execute one chunk only.

A chunk should include:

```text
goal
files to inspect
files to change
out of scope
implementation details
tests to add
validation commands
final report requirements
```

## Stop gates

Stop after:

```text
schema changes
new package boundary
new optional dependency
network behavior
workspace migration
index storage format
self-hosted auth behavior
plugin loading behavior
```

These require maintainer review before continuing.

## Release policy

```text
No version bump during feature chunks.
No publish from implementation prompts.
No changeset unless explicitly requested.
Release trains get readiness pass first.
```

---

# Contributor roadmap alignment

v4–v6 should expose contributor-friendly work:

```text
workspace docs
workspace fixtures
index query examples
session fixtures
bundle templates
observed outcome examples
suite templates
PM/QA templates
viewer screenshots
MCP docs
standards recipes
plugin examples
```

Avoid assigning contributors:

```text
schema internals
redaction internals
network ingestion auth
plugin loading security
self-hosted auth
release machinery
root package exports
```

---

# Adoption gates

## After v4

Expected:

```text
users initialize workspaces
users index local traces
users export bundles
users inspect sessions
```

Evidence:

```text
external issues about workspace/index/session
starter usage
bundle feedback
```

## After v5

Expected:

```text
teams run trace suites
CI gates fail usefully
PM/QA templates used
cohort comparisons run
```

Evidence:

```text
CI workflows
suite configs in external repos
questions about checks/templates rather than setup
```

## After v6

Expected:

```text
self-hosted Studio evaluated by teams
MCP read-only tools used by coding agents
standards graduation recipes tried
plugins validated
```

Evidence:

```text
design partner feedback
self-hosted deployment issues
third-party plugins/adapters
```

## Before v7

Required:

```text
retained workspace usage
trace suites in real CI
self-hosted Studio use
external plugin/adapter interest
clear pull for intelligence/context/browser support
```

If these are not met, do not build v7. Focus on adoption and narrow the product.

---

# Final strategic position

AgentInspect should own:

```text
Local and self-hosted evidence for TypeScript AI agent behavior.
```

That includes:

```text
trace
check
redact
report
bundle
index
session
suite
studio
MCP context
standards graduation
```

It should not become:

```text
hosted observability SaaS
prompt platform
dataset platform
cost platform
vendor telemetry router
production replay system
```

The next aggressive but coherent path is:

```text
v4 — Local Trace Workspace
v5 — Trace Suites and Regression Evaluation
v6 — Self-hosted Studio and Team Analyzer
v7 — Conditional Ecosystem and Intelligence Layer
```
