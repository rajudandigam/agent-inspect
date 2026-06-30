# AgentInspect Post-v3 Roadmap: v3.1 → v3.5

## Strategic goal

AgentInspect should now optimize for this sentence:

**Install it, run one command, inspect one trace, check one failure, and safely share one artifact in under five minutes.**

The product is already broad enough. The next few releases should make it easy to start, easy to trust, easy to integrate, and easy to demo.

The post-v3 roadmap should not chase a larger platform. It should close these remaining gaps:

1. Public harness for real project runners
2. Init/doctor onboarding
3. Framework-specific starter paths, especially AI SDK and NestJS
4. Minimal VS Code extension
5. Performance/error-message hardening
6. Presentation/demo/adoption assets

After v3.5, pause development and focus on adoption.

## Train sequence

| Train | Focus |
| ----- | ----- |
| [v3.1.0](./release-trains/V3.1.0-EXECUTION-PLAN.md) | Harness, init, doctor, starter templates |
| [v3.2.0](./release-trains/V3.2.0-EXECUTION-PLAN.md) | Framework adoption pack (AI SDK, OpenAI Agents, NestJS) |
| [v3.3.0](./release-trains/V3.3.0-EXECUTION-PLAN.md) | Minimal VS Code extension and UI polish |
| [v3.4.0](./release-trains/V3.4.0-EXECUTION-PLAN.md) | Performance limits, stall detection, streaming UX |
| [v3.5.0](./release-trains/V3.5.0-EXECUTION-PLAN.md) | Adoption, presentation, demo kit |

## Non-goals (all post-v3 trains)

Hosted dashboard, SaaS, marketplace, Python SDK, cost engine, replay/cassette, context compression package, live OTLP bridge, broad adapter matrix, root framework dependencies, telemetry by default, hidden network behavior, default prompt/output capture, raw chain-of-thought capture.

---

## v3.1.0 — Harness, Init, Doctor, and Starter Templates

### Goal
Reduce first-use and real-project integration friction.
This should be the first post-v3 minor release because it addresses the biggest remaining practical gap: real projects still need too much runner/bootstrap glue.
Why this matters
The feedback repeatedly says that mature projects need fixture loading, CLI arg parsing, app bootstrap/shutdown, target selection, and trace wrapping. The default-niche plan explicitly calls @agent-inspect/harness a top gap because teams otherwise rewrite 100+ lines of scaffolding around every real integration.
The package already exists, but is private and not aligned with the v3 public package family. So v3.1 should either publish it or explicitly replace it with first-class recipes. My decision: publish it if tests are already in decent shape.
Scope
1. Publish @agent-inspect/harness
Package:
@agent-inspect/harness

Make it public and align it with v3.1.x.
Core API:
import {
  createFixtureRunner,
  defineTarget
} from "@agent-inspect/harness";

await createFixtureRunner({
  name: "support-agent",
  traceDir: ".agent-inspect/support-agent",

  bootstrap: async () => {
    return bootstrapAppForLocalAgentRun();
  },

  shutdown: async (app) => {
    await app.close?.();
  },

  targets: {
    refund: defineTarget({
      description: "Run refund policy agent",
      resolve: (app) => app.get(RefundPolicyAgent),
      invoke: (agent, input) => agent.run(input)
    })
  }
}).runFromArgv();

Harness owns:
CLI arg parsing
target listing
fixture loading
JSON stdin
observe() wrapping
maybeInspectRun() gating
trace directory convention
stdout/stderr behavior
graceful shutdown
expected-output marker support

Harness does not own:
Nest-specific env vars
Redis/SQS mocking
application-specific bootstrapping
real model calls
framework-specific DI assumptions

2. Add agent-inspect init
Command:
npx agent-inspect init
npx agent-inspect init --framework ai-sdk
npx agent-inspect init --framework openai-agents
npx agent-inspect init --framework langchain
npx agent-inspect init --framework custom
npx agent-inspect init --ci github

Generated outputs:
agent-inspect.config.ts
.agent-inspect/
examples/agent-inspect-demo.ts
optional GitHub Actions artifact snippet

Init should support:
observe existing object/class
AI SDK telemetry adapter
OpenAI Agents local-only processor
LangChain callback
CI check/eval setup
redaction-only setup
adapter authoring

No dependency should be installed automatically without confirmation.
3. Add agent-inspect doctor
Command:
agent-inspect doctor
agent-inspect doctor --json

Checks:
Node version
agent-inspect version
CLI binary
trace directory writable
ESM/CJS import smoke
AGENT_INSPECT env
AGENT_INSPECT_TRACE_DIR env
optional package availability
peer dependency status
adapter config hints
version mismatch
known stale docs/release-state warning

4. Starter templates
Add small, blessed starters:
examples/starters/custom-observe
examples/starters/ai-sdk
examples/starters/openai-agents
examples/starters/langchain
examples/starters/ci-eval-redact
examples/starters/harness-nestjs

Each starter should include:
README
package.json
one command to run
expected trace command
expected check command
safe sharing note

Non-goals
No new observability backend
No cloud upload
No framework dependency in root
No complex app generator
No hosted templates
No telemetry

Success criteria
A user can run `npx agent-inspect init` and get first trace in under 5 minutes.
A mature app can use @agent-inspect/harness instead of writing its own runner shell.
`doctor` catches common setup problems.
At least 5 deterministic starter templates pass recipes validation.


v3.2.0 — Framework Adoption Pack: AI SDK, OpenAI Agents, NestJS
Goal
Make AgentInspect feel like it belongs inside real TypeScript AI stacks.
Do not build ten shallow adapters. Harden and document the ones that create adoption.
The feedback keeps calling out Vercel/AI SDK, OpenAI Agents, and NestJS. The README you shared already has AI SDK, OpenAI Agents, and LangChain examples, but the package needs stronger “blessed path” integration and proof.
Scope
1. AI SDK adoption hardening
Package:
@agent-inspect/ai-sdk

Make it the best-documented integration path.
Add:
AI SDK quickstart above manual instrumentation in docs
Next.js route handler example
streamText example
tool-call example
metadata-only privacy example
recordInputs false / recordOutputs false explanation
no-network fixture
adapter conformance result
troubleshooting page

Example:
import { generateText } from "ai";
import { agentInspect } from "@agent-inspect/ai-sdk";

await generateText({
  model,
  prompt,
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        traceDir: ".agent-inspect",
        runName: "support-agent",
        capture: "metadata-only"
      })
    ]
  }
});

2. OpenAI Agents local-only hardening
Package:
@agent-inspect/openai-agents

Clarify:
additional processor mode
replacement processor mode
which mode may still allow OpenAI default exporting
which mode is local-only
how guardrails/handoffs/tools map
how MCP spans map when available

Docs must make this distinction very clear because users may assume all OpenAI Agents tracing is local. OpenAI’s Agents SDK supports custom trace processors and replacement processor lists, so AgentInspect should stay on that official hook rather than wrapping or monkey-patching. The earlier roadmap already made this the correct approach.
3. NestJS integration path
I would not jump directly to a heavy NestJS package unless the API is very small. The v3.2 version should first ship a NestJS harness recipe and helper.
Option A, lightweight package:
@agent-inspect/nestjs

Scope:
createNestFixtureRunner()
observeProvider()
TestingModule bootstrap helper
optional provider override helper
traceDir and redactionProfile config
no production interceptor yet

Option B, if not ready to publish:
docs/NESTJS.md
examples/starters/harness-nestjs
examples/recipes/nestjs-provider-observe

My recommendation: ship docs + recipe first, then publish @agent-inspect/nestjs only if the helper avoids framework-specific complexity.
4. Mastra decision
Add a scoped RFC only.
docs/proposals/MASTRA-ADAPTER-RFC.md

Do not implement unless:
Mastra extension API is stable
2+ external users ask
1 design partner validates

Non-goals
No broad adapter matrix
No auto-instrumentation magic
No root dependency on AI SDK/OpenAI/NestJS
No provider SDK wrappers
No vendor upload

Success criteria
AI SDK user gets a local trace with one telemetry integration.
OpenAI Agents user can choose local-only tracing with no ambiguity.
NestJS users get a working bootstrap pattern.
Docs lead with the best-supported framework paths.


v3.3.0 — Minimal VS Code Extension and UI Polish
Goal
Reduce terminal/editor context switching without building a full dashboard.
The feedback calls the missing VS Code extension a high-priority gap and argues that modern devtools often need an IDE surface. I agree, but only if it is thin and reuses existing CLI/report/readers.
Package / repo layout
Either:
packages/vscode

or separate repo later. For now, keep it in monorepo if it can be built/tested without bloating root.
Extension name:
agent-inspect-vscode

MVP features
1. Trace directory auto-detect
Detect:
.agent-inspect/
.agent-inspect-runs/
AGENT_INSPECT_TRACE_DIR

2. Trace explorer panel
Show:
runs
status
duration
last modified
errors
sessions if available

3. Open report
Buttons:
View Tree
View Timeline
View Report
View Check Results
Open HTML Report

Internally call existing CLI or read existing JSON/report artifacts. Do not reimplement the core parser in extension code unless necessary.
4. CodeLens / gutter link, minimal
If a file contains a trace ID or .agent-inspect path, show:
Open AgentInspect Trace

5. Commands
AgentInspect: Open Trace Directory
AgentInspect: Refresh Traces
AgentInspect: Run Doctor
AgentInspect: Generate Report
AgentInspect: Verify Safe

Hard boundaries
Read-only by default
No uploads
No account
No hosted sync
No editor telemetry
No auto-fix
No replay
No trace mutation

UI improvements outside VS Code
Also improve:
docs/SCREENSHOTS.md
GIFs for check/eval/redact/viewer
single-page demo walkthrough
viewer landing page
report CSS polish

Success criteria
A VS Code user can inspect a trace without leaving the editor.
The extension is thin and read-only.
It reuses CLI/core outputs.
It does not become a dashboard product.
The README can show one screenshot/GIF of editor-native trace viewing.


v3.4.0 — Performance, Silent Failure Detection, and Streaming UX
Goal
Make AgentInspect trustworthy for larger local trace directories and long-running agent workflows.
The deep feedback calls out undocumented performance boundaries, lack of hang detection, no liveness checks, and no real-time progress for long-running agents. These are adoption blockers for serious users.
Scope
1. Performance baseline docs
Add:
docs/PERFORMANCE.md
docs/SCALE-LIMITS.md

Benchmarks:
100 runs
1,000 runs
10,000 events
100,000 events
large JSONL file
large trace directory
open/read time
search time
stats time
check time
report time
viewer startup time
indexer rebuild time
memory usage

Output should say:
Works comfortably up to X
Warning threshold at Y
Not designed for Z
Suggested archive/split strategy

2. Large-directory warnings
CLI should warn when:
trace count exceeds threshold
file size exceeds threshold
search/stats may be slow
indexer recommended if available

No database dependency in root.
3. Optional indexer hardening
Since v3 introduced optional indexer contracts, use them in a bounded way:
agent-inspect index build
agent-inspect index status
agent-inspect index clean

But keep the index rebuildable and optional.
4. Silent failure / timeout guards
Add deterministic guard utilities, probably through existing @agent-inspect/circuit:
max step duration
expected step by time
long-running tool timeout
stalled stream detection
no completion event after start

Commands:
agent-inspect check trace.jsonl --max-step-duration 30s
agent-inspect check trace.jsonl --require-completed
agent-inspect check trace.jsonl --detect-stalls

5. Streaming limitations guide
Add:
docs/STREAMING-LIMITATIONS.md

Cover:
AI SDK lifecycle limitations
OpenAI Agents span lifecycle limitations
LangChain/LangGraph callback propagation issues
what AgentInspect can infer
what it cannot fix
recommended workarounds

Non-goals
No production monitoring
No live alerting backend
No hosted indexing
No semantic vector search yet
No production APM claims

Success criteria
Users know local scale boundaries.
Long-running or incomplete traces produce actionable warnings.
Check/circuit rules catch common hangs and runaway loops.
Performance claims are documented and tested.


v3.5.0 — Adoption, Presentation, and External Proof Kit
Goal
Stop adding product surface and make adoption easier.
This should be the final pre-adoption minor release.
Scope
1. Adoption documentation
Add:
docs/ADOPTION.md
docs/DEMO-SCRIPT.md
docs/VIDEO-WALKTHROUGH-SCRIPT.md
docs/SHOW-HN-DRAFT.md
docs/CASE-STUDY-TEMPLATE.md
docs/PITCH.md
docs/DESIGN-PARTNER-GUIDE.md

2. Demo assets
Create demo flow:
Broken AI SDK agent
Run with AgentInspect
Open trace in CLI
Open trace in VS Code
Run check
Run eval
Run redact
Generate report
Fix bug
Diff before/after
Create share-safe artifact

3. Starter repos / examples
Add or polish:
examples/starter-ai-sdk
examples/starter-openai-agents
examples/starter-custom-observe
examples/starter-ci-eval-redact
examples/starter-harness-nestjs
examples/starter-vscode-trace-review

4. Website/presentation content
If there is no docs website, create simple repo assets first:
docs/assets/hero-terminal.svg
docs/assets/vscode-preview.png
docs/assets/check-failure.png
docs/assets/redact-flow.png
docs/assets/ai-sdk-flow.png

Slide outline:
Problem: console.log fails for agents
Solution: trace + check + redact locally
Demo: failed run to fixed run
Privacy: no upload by default
Frameworks: AI SDK / OpenAI Agents / LangChain
CI: deterministic artifacts
Extension: adapter SDK
Call to action: try starter

5. Public comparison refresh
Update:
docs/COMPARE.md
README comparison section

Position against:
LangSmith — production + hosted observability
Langfuse — open-source hosted/self-hosted observability
Braintrust — eval platform
Phoenix — standards/Python-first observability
console.log — flat logs
OpenTelemetry directly — powerful but not local DX

Keep tone respectful and factual.
6. Adoption gates
Add:
docs/product/ADOPTION-METRICS.md

Metrics:
install → first trace
first trace → first report
first trace → first check
starter completion
VS Code extension install
adapter package usage
npm package-specific trends
public dependents
external issues/discussions
external PRs

Do not add hidden telemetry by default.
Optional:
agent-inspect usage-report --output agent-inspect-usage.json

Must be local and user-submitted only.
Non-goals
No new runtime feature surface
No new adapter
No hosted dashboard
No telemetry by default
No marketplace
No Python SDK

Success criteria
A maintainer can publish a 3-minute demo immediately.
A new user can choose a starter and succeed.
A design partner can understand the exact evaluation path.
README feels market-ready.
No more feature work is needed before adoption push.


Final recommended sequence
v3.0.1  Publication verification + source-of-truth cleanup
v3.1.0  Public harness + init + doctor + starter templates
v3.2.0  Framework adoption pack: AI SDK, OpenAI Agents, NestJS path
v3.3.0  Minimal VS Code extension + UI/report polish
v3.4.0  Performance limits + silent failure/stall checks + streaming limitations
v3.5.0  Adoption/presentation/demo kit

If you want to avoid too many releases, combine v3.0.1 into v3.1.0 as a first release-prep chunk. But I would still keep it logically separate.

What I would not include in v3.1–v3.5
Do not add @agent-inspect/context yet
The context/Headroom analysis is interesting, but it is a research track, not a final pre-adoption feature. The correct framing is trace-aware, auditable context optimization, not a generic Headroom clone. The feedback explicitly recommends a research spike first and warns not to build a cloud compression API, provider cost estimator, or “we beat Headroom” clone.
Add only:
docs/proposals/CONTEXT-OPTIMIZATION-RFC.md
fixtures/context/

No package yet.
Do not build @agent-inspect/otel-bridge yet
OpenTelemetry live forwarding is useful, but it is not a low-hanging fruit. The product’s differentiation is local-first. Build live OTLP only after adoption, or when a design partner specifically asks.
Do not build Mastra/LangGraph/Nest packages all at once
For v3.2:
AI SDK: strengthen
OpenAI Agents: strengthen
NestJS: recipe/helper
LangGraph: document through LangChain unless clear demand
Mastra: RFC only

Do not build cost engine
Token/cost metadata can remain user-supplied. Do not maintain provider pricing tables.
Do not build replay
Still no.
Do not build a hosted dashboard
Still no.

Implementation-focused breakdown by release
v3.1.0 chunks
3.1-0 audit current package state and publish verification
3.1-1 make @agent-inspect/harness public or finalize harness recipes
3.1-2 implement `agent-inspect init`
3.1-3 implement `agent-inspect doctor`
3.1-4 add starter templates
3.1-5 docs/readme onboarding update
3.1-6 release readiness

Validation:
pnpm build
pnpm typecheck
pnpm test
pnpm recipes:check
pnpm fixtures:check
pnpm pack:smoke
pnpm compat:smoke
npm pack --dry-run

v3.2.0 chunks
3.2-1 AI SDK adapter docs/examples hardening
3.2-2 OpenAI Agents local-only docs/examples hardening
3.2-3 NestJS harness recipe/helper
3.2-4 Mastra RFC and adapter scorecard
3.2-5 adapter conformance evidence refresh
3.2-6 release readiness

Validation:
pnpm --filter @agent-inspect/ai-sdk test
pnpm --filter @agent-inspect/openai-agents test
pnpm recipes:check
pnpm pack:smoke
pnpm compat:smoke

v3.3.0 chunks
3.3-1 VS Code extension RFC and package scaffold
3.3-2 trace directory detection and explorer panel
3.3-3 open report/timeline/check commands
3.3-4 doctor integration
3.3-5 screenshots/GIFs and viewer/report polish
3.3-6 release readiness

Validation should include extension packaging smoke if available:
pnpm build
pnpm test
pnpm pack:smoke
pnpm compat:smoke

If extension packaging adds toolchain complexity, keep the extension in a separate repo or release it as preview docs only.
v3.4.0 chunks
3.4-1 performance benchmark expansion
3.4-2 docs/PERFORMANCE.md and docs/SCALE-LIMITS.md
3.4-3 large-directory warnings
3.4-4 optional indexer CLI polish
3.4-5 stall/timeout/circuit check rules
3.4-6 streaming limitations guide
3.4-7 release readiness

Validation:
pnpm perf:baseline
pnpm test
pnpm fixtures:check
pnpm recipes:check

v3.5.0 chunks
3.5-1 adoption docs
3.5-2 demo/video scripts
3.5-3 starter examples polish
3.5-4 comparison/pitch refresh
3.5-5 design partner kit
3.5-6 release readiness

Validation:
pnpm typecheck
pnpm test
pnpm recipes:check
pnpm fixtures:check
git diff --check


Stop point after v3.5
After v3.5, stop building features for 8–12 weeks.
Focus on:
Show HN
AI SDK community
OpenAI Agents JS community
LangChain/LangGraph JS community
MCP community
NestJS AI projects
TypeScript AI newsletters
demo videos
design partner outreach
case studies
adapter-author outreach

Measure:
npm package usage by package
GitHub dependents
external issues
external PRs
VS Code extension installs
starter template usage
adapter package downloads
CI reporter usage
docs traffic if available

Success signal:
3+ unrelated repos retain AgentInspect
3+ users run check/eval/report repeatedly
1+ public case study
1+ third-party adapter or extension
users ask compatibility questions instead of setup questions

If adoption improves, then consider:
@agent-inspect/context RFC → package
thin OTel bridge
more framework adapters
deeper VS Code
adapter-sdk enhancements

If adoption stays weak, narrow around the strongest path:
AgentInspect for AI SDK local debugging

or:
AgentInspect for deterministic CI checks and safe trace artifacts


Final decision
I would authorize five more minor trains after v3.0:
v3.1 — Harness + init + doctor
v3.2 — Framework adoption pack
v3.3 — VS Code extension + UI polish
v3.4 — Performance/stall/streaming hardening
v3.5 — Adoption/demo/presentation kit

Then stop feature development.
This closes the most important remaining adoption gaps while preserving the core product boundary: local-first, TypeScript-first, no account, no upload, no hosted dashboard, no replay, no cost engine.
