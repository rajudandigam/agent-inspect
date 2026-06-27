# AgentInspect Roadmap

> **Current direction:** AgentInspect is the local-first toolkit for TypeScript AI agents: trace what happened, check what should have happened, and redact what should never leave your machine.

AgentInspect should become the default local TypeScript utility for agent trace inspection, deterministic agent checks, safe trace sharing, and framework-native local debugging.

It is **not** a hosted observability platform, SaaS dashboard, replay engine, prompt registry, dataset manager, or provider cost platform.

---

## Product thesis

AgentInspect helps TypeScript developers understand AI agent behavior locally.

It should let developers:

- capture or open an agent trace;
- inspect execution trees, timelines, errors, tool calls, LLM calls, retries, and decisions;
- compare runs after a prompt, model, routing, or tool change;
- run deterministic checks in local development and CI;
- produce share-safe reports for pull requests, incidents, and debugging handoffs;
- keep data on disk by default;
- use framework-native integrations when available;
- graduate to OpenInference / OpenTelemetry-compatible observability when needed.

The practical product promise:

> **Open a TypeScript agent trace locally. Understand it, diff it, check it, and share it safely — without an account or collector.**

Useful mental models:

```text
jq for agent traces
git diff for agent runs
Vitest-style assertions for agent behavior
```

---

## Product boundaries

### AgentInspect is

- local-first;
- CLI-first;
- TypeScript-first;
- safe by default;
- dependency-light at the root;
- framework-aware but not framework-locked;
- useful alongside production observability;
- standards-compatible over time;
- privacy-conscious;
- deterministic by default.

### AgentInspect is not

- a SaaS product;
- a hosted dashboard;
- a production APM replacement;
- a default network uploader;
- a prompt registry;
- an eval dataset platform;
- an LLM-as-judge platform;
- a provider pricing engine;
- a raw chain-of-thought capture system;
- a default replay/cassette engine;
- a universal monkey-patching framework.

---

## Current baseline

AgentInspect has already shipped a broad local-first foundation.

Current capability areas include:

- manual tracing with `inspectRun`, `maybeInspectRun`, `step`, `step.llm`, `step.tool`, and `observe`;
- local JSONL traces;
- redaction before disk;
- redaction profiles;
- event size bounds;
- correlation metadata;
- dual-format v0.1/v0.2 reading;
- subpath exports;
- `what` and `report`;
- `timeline`, `stats`, and `search`;
- `open` for local AgentInspect / OpenInference / OTLP-style trace ingestion;
- deterministic `check` foundation;
- safe-sharing workflows such as `scan` / `verify-safe`;
- AI SDK adapter foundation;
- OpenAI Agents adapter foundation;
- LangChain adapter;
- optional TUI;
- CI artifact recipes;
- public community and contribution scaffolding.

The next phase should focus less on adding disconnected features and more on **adoption leverage**:

1. make the first five minutes obvious;
2. reduce integration boilerplate;
3. make adapters first-class;
4. make traces useful immediately after capture;
5. prepare a clean v2 contract.

---

## Roadmap summary

| Release | Theme | Primary outcome |
|---|---|---|
| v1.8.1 | Docs truth + adoption polish | Fix public story, lead with `observe`, promote adapters, align docs |
| v1.9.0 | Adoption leverage | Harness, explain, adapter promotion, root API slimming plan |
| v2.0.0 | Stable local trace contract | Small root API, schema 1.0, migration, stable readers/writers/checks |
| v2.1.0 | Eval + redact utility triangle | `@agent-inspect/eval`, `@agent-inspect/redact` |
| v2.2.0 | Test reporters + CI workflows | Public Vitest/Jest reporters, CI summaries, trace/eval artifacts |
| v2.3.0 | Framework adapter hardening | AI SDK, OpenAI Agents, LangGraph, Mastra/Nest only if demanded |
| v2.4.0 | Sessions, multi-agent, MCP | Session navigation, handoffs, retries, MCP tool tracing |
| v2.5.0 | Guardrails + circuit breakers | Local deterministic safety utilities |
| v2.6.0 | Optional viewer and IDE/MCP surfaces | Local viewer, read-only MCP server, editor surfaces if demanded |
| v3.0.0 | Extensible trace toolchain | Stable extension ecosystem, only if adoption proves demand |

---

# v1.8.1 — Documentation truth and adoption polish

## Goal

Make the public docs match the actual product and make the easiest adoption path obvious.

This is a patch-level release or docs-only release train.

## Why this comes first

The current library already has strong capabilities, but the public story can still feel like a collection of historical features. Adoption depends on a fast first impression.

The docs should answer:

```text
What is this?
Why do I need it?
How do I get a useful trace in five minutes?
How do I use it with my framework?
How do I keep data local and safe?
```

## Scope

Update the public docs as a first-class roadmap step.

Files to review and update:

```text
README.md
ROADMAP.md
CHANGELOG.md
docs/GETTING-STARTED.md
docs/API.md
docs/CLI.md
docs/SCHEMA.md
docs/ADAPTERS.md
docs/EXPORTS.md
docs/SAFE-TRACE-SHARING.md
docs/LIMITATIONS.md
docs/KNOWN-ISSUES.md
docs/MIGRATION.md
docs/COMPARE.md
docs/ADAPTER-CONFORMANCE.md
examples/00-quickstart-demo
examples/recipes/observe-agent
examples/recipes/ai-sdk-local-telemetry
examples/recipes/openai-agents-local-only
```

## Required docs changes

### 1. Make `observe()` the first quickstart

Lead with the lowest-friction API:

```ts
import { observe } from "agent-inspect";

class SupportAgent {
  async run(input: { question: string }) {
    return {
      answer: `Answering: ${input.question}`
    };
  }
}

const agent = observe(new SupportAgent(), {
  traceDir: "./.agent-inspect"
});

await agent.run({
  question: "How do refunds work?"
});
```

Then show manual `inspectRun` + `step` as the power-user path for custom spans and non-class flows.

### 2. Promote framework paths

The README should show three adoption paths near the top:

```text
Path A — Observe an existing object/class
Path B — Use a framework adapter
Path C — Manually instrument custom flows
```

Framework snippets should include:

- AI SDK local telemetry;
- OpenAI Agents local-only processor;
- LangChain callback adapter.

### 3. Demote structured log parsing to an advanced path

Structured logs remain useful, but they should no longer compete with the primary adoption story.

Position it as:

```text
Advanced ingestion: use this when your app already emits structured logs.
```

### 4. Clarify root API and subpath strategy

Docs should say:

```text
Use the root import for stable beginner APIs.
Use subpaths for advanced, experimental, or lower-level workflows.
```

Recommended root import story:

```ts
import {
  observe,
  inspectRun,
  maybeInspectRun,
  step,
  getCurrentCorrelationMetadata
} from "agent-inspect";
```

Advanced imports should use:

```ts
import { openTrace } from "agent-inspect/readers";
import { memoryWriter } from "agent-inspect/writers";
import { assertTrace } from "agent-inspect/checks";
```

### 5. Align version language

Every public doc should agree on the current release and what shipped in that release.

### 6. Make safe sharing visible

The README should link clearly to safe trace sharing and explain:

- no upload by default;
- redaction before disk;
- redaction before export;
- `scan`;
- `verify-safe`;
- share/strict profiles.

## Non-goals

- no runtime behavior changes unless examples require tiny fixes;
- no package version bump unless docs are published as a patch;
- no new adapters;
- no schema change;
- no network behavior.

## Success criteria

- A new user can understand the product in one scroll.
- A new user sees `observe()` before manual boilerplate.
- AI SDK and OpenAI Agents users can find a local-tracing path quickly.
- All docs agree on current version/capabilities.
- Logs are still documented but clearly secondary.
- Safe sharing is visible, not buried.

---

# v1.9.0 — Adoption leverage release

## Goal

Convert existing capability into repeated use.

v1.9 should reduce integration friction, create a useful “explain this trace” workflow, and make adapters feel like first-class adoption paths.

## Primary scope

1. `@agent-inspect/harness`
2. `agent-inspect explain`
3. Adapter promotion
4. Root API slimming plan

---

## v1.9.0-A — `@agent-inspect/harness`

### Goal

Make fixture-driven local agent runners easy for real projects.

### Why

Mature projects often need to run one sub-agent, one tool, or one workflow path without booting the entire production application. Teams otherwise write the same runner code repeatedly: argument parsing, fixture loading, bootstrap/shutdown, `observe()` wrapping, trace directory setup, output formatting, and error handling.

### Package

```text
@agent-inspect/harness
```

### API sketch

```ts
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
      description: "Run refund-policy agent",
      resolve: (app) => app.get(RefundPolicyAgent),
      invoke: (agent, input) => agent.run(input)
    }),

    classify: defineTarget({
      description: "Run intent classifier",
      resolve: (app) => app.get(IntentClassifier),
      invoke: (agent, input) => agent.invoke(input)
    })
  }
}).runFromArgv();
```

### Harness should provide

- CLI argument parsing;
- target listing;
- fixture loading;
- JSON stdin support;
- target metadata;
- trace directory conventions;
- `observe()` wrapping;
- `maybeInspectRun()` / `AGENT_INSPECT` gating;
- output JSON to stdout;
- trace/report/check summary to stderr;
- graceful shutdown;
- error handling;
- optional expected-output path;
- optional per-fixture metadata.

### Harness should not provide

- app-specific environment variables;
- proprietary configuration systems;
- real queue/SQS/Redis stubbing;
- real model calls;
- framework-specific bootstrapping hidden inside core.

### Recipes

```text
examples/recipes/harness-basic
examples/recipes/harness-nestjs-bootstrap
examples/recipes/harness-ai-sdk-tool
examples/recipes/harness-langgraph-node
```

### Success criteria

- A mature project can create a local agent runner in under 50 lines.
- Harness output works with `what`, `report`, `diff`, `check`, `scan`, and `verify-safe`.
- No framework dependency enters root.
- The recipe explains what the library can absorb and what remains app-specific.

---

## v1.9.0-B — `agent-inspect explain`

### Goal

Create a high-value command that explains failed or surprising traces in plain language while preserving local-first safety.

### CLI

```bash
agent-inspect explain <runId>
agent-inspect explain <trace-file>
agent-inspect explain <trace-file> --provider ollama
agent-inspect explain <trace-file> --provider openai
agent-inspect explain <trace-file> --provider anthropic
agent-inspect explain <trace-file> --dry-run
agent-inspect explain <trace-file> --redaction-profile strict
```

### Package boundary

Prefer:

```text
@agent-inspect/explain
```

or a clearly experimental subpath.

Do not add cloud provider SDKs to the root package.

### Required workflow

1. Read trace through the existing reader.
2. Generate deterministic `what` / report data.
3. Apply `share` or `strict` redaction.
4. Show exact payload in `--dry-run`.
5. Require explicit provider selection.
6. Invoke a provider only after explicit selection.
7. Separate trace facts from model inference.

### Output sections

```text
Summary
Facts from trace
Likely failure point
Slowest path
Suspicious behavior
Suggested next investigation
Uncertainty
```

### Safety rules

- no provider selected by default;
- no silent network call;
- no chain-of-thought request;
- no raw prompts/outputs unless explicitly captured and included by the user;
- redaction before provider call;
- label inferred claims.

### Success criteria

- Useful on failed traces and confusing tool paths.
- `--dry-run` shows exactly what would leave the machine.
- Local provider path works without cloud.
- Cloud providers are explicit and opt-in.
- The README can show a compelling demo without violating privacy principles.

---

## v1.9.0-C — Adapter promotion

### Goal

Make existing framework integrations feel like first-class adoption paths.

### AI SDK

Promote `@agent-inspect/ai-sdk` with:

- top-level README example;
- no-network recipe;
- Next.js route example;
- `streamText` example;
- tool-call example;
- conformance fixtures;
- explicit privacy defaults.

### OpenAI Agents

Promote `@agent-inspect/openai-agents` with:

- additional processor mode;
- replacement/local-only mode;
- clear privacy wording;
- agent/generation/tool/handoff/guardrail coverage;
- runnable local-only recipe.

### LangChain / LangGraph

Keep improving through `@agent-inspect/langchain` unless there is proven demand for a separate package.

Add recipe coverage for:

- graph node identity;
- subgraphs;
- checkpoint metadata;
- stream modes;
- parallel branches;
- handoffs.

### Success criteria

- README quickstart gives adapter path before manual instrumentation.
- AI SDK users can get a local trace with one integration option.
- OpenAI Agents users understand local-only vs additional processor mode.
- Framework examples produce local traces without live vendor calls where possible.

---

## v1.9.0-D — Root API slimming plan

### Goal

Prepare v2 without breaking 1.x.

### v1.9 approach

Do not remove existing root exports in v1.x unless explicitly accepting a breaking release.

Instead:

- document stable root imports;
- add JSDoc deprecation notices for advanced root exports where practical;
- ensure every advanced symbol has a subpath home;
- update docs/examples to use subpaths;
- add package tests to prevent new advanced root exports from being added accidentally;
- add a migration table for v2.

### Stable root target

```ts
import {
  inspectRun,
  maybeInspectRun,
  step,
  observe,
  getCurrentCorrelationMetadata
} from "agent-inspect";
```

Potentially include:

```ts
createInspector // still experimental until v2
```

### Advanced subpaths

```text
agent-inspect/advanced
agent-inspect/readers
agent-inspect/writers
agent-inspect/checks
agent-inspect/diff
agent-inspect/exporters
agent-inspect/logs
agent-inspect/persisted
```

### Success criteria

- Public docs show small root surface.
- Advanced examples use subpaths.
- v2 migration path is obvious.
- No 1.x consumer break.

---

# v2.0 — Stable local trace utility contract

## Goal

Make AgentInspect feel like a standard TypeScript utility.

v2 should be a clean contract release, not a pile of unrelated features.

## v2 root API

```ts
import {
  createInspector,
  inspectRun,
  maybeInspectRun,
  step,
  observe,
  getCurrentCorrelationMetadata
} from "agent-inspect";
```

Only essential stable types should remain at root.

## v2 subpaths

```text
agent-inspect/readers
agent-inspect/writers
agent-inspect/checks
agent-inspect/diff
agent-inspect/exporters
agent-inspect/logs
agent-inspect/persisted
agent-inspect/advanced
```

## v2 persisted format

Introduce:

```text
schemaVersion: "1.0"
```

### Compatibility

```text
read v0.1
read v0.2
read v1.0
write v1.0 by default
```

### Migration

```bash
agent-inspect migrate ./old-traces --to 1.0 --dry-run
agent-inspect migrate ./old-traces --to 1.0 --out ./migrated-traces
```

Never overwrite originals by default.

## Stable contracts

- `AgentEvent`
- `Inspector`
- `TraceReader`
- `TraceWriter`
- `TraceCheck`
- `TraceCheckResult`
- `TraceReporter`
- `TraceExporter`
- `TraceAdapter`
- redaction profiles
- capture policy
- source metadata
- token metadata
- session/correlation metadata
- error model
- conformance fixtures

## v2 release strategy

Use release candidates:

```text
2.0.0-rc.1
2.0.0-rc.2
2.0.0
```

### v2 release gate

Do not publish v2 stable until:

- all current recipes pass;
- all adapters pass conformance;
- v0.1/v0.2 traces remain readable;
- root API is small;
- migration dry-run works;
- docs show v2 migration clearly;
- at least three external users or repos test the RC;
- no hidden network behavior exists;
- package smoke and compatibility smoke pass.

---

# v2.1 — Utility triangle: eval and redact

## Goal

Turn AgentInspect from a trace utility into the local TypeScript agent toolkit:

```text
trace + eval + redact
```

---

## `@agent-inspect/eval`

### Goal

Add deterministic local eval primitives.

This should not compete with Braintrust, LangSmith, Langfuse, or Phoenix datasets. It should give developers fast local assertions for agent behavior.

### API

```ts
import { evalRun, checks } from "@agent-inspect/eval";

const result = await evalRun("trace.jsonl", {
  checks: [
    checks.requireSuccess(),
    checks.requiredTools(["retrievePolicy"]),
    checks.forbiddenTools(["deleteAccount"]),
    checks.maxDurationMs(5000),
    checks.maxTotalTokens(8000),
    checks.outputContains("30 days")
  ]
});
```

### Deterministic checks

- exact match;
- contains;
- regex;
- JSON shape;
- user-supplied schema validation;
- required keys;
- required tools;
- forbidden tools;
- max retries;
- max duration;
- max depth;
- max token budget;
- no failed steps;
- required guardrail;
- required retrieval before generation;
- required decision metadata.

### Grounding checks

No LLM judge by default.

Support deterministic/local heuristics:

- context overlap;
- quote overlap;
- citation presence;
- required source IDs;
- answer length bounds;
- banned unsupported phrases.

### Optional local embeddings

Only after deterministic checks are solid:

- optional peer dependency;
- no large model in root;
- no network by default.

### CLI

```bash
agent-inspect eval trace.jsonl --config agent-inspect.eval.ts
agent-inspect eval trace.jsonl --require-success
agent-inspect eval trace.jsonl --forbid-tool deleteAccount
```

---

## `@agent-inspect/redact`

### Goal

Promote trace redaction into a reusable TypeScript utility.

### API

```ts
import { redact, createRedactor } from "@agent-inspect/redact";

const safe = redact(input, {
  profile: "share"
});
```

### Profiles

- `local`
- `share`
- `strict`

### Detectors

- email;
- phone;
- authorization headers;
- bearer tokens;
- cookies;
- JWT;
- provider API key patterns;
- GitHub tokens;
- AWS-style keys;
- private key blocks;
- credit-card-like values with Luhn check;
- IPv4/IPv6;
- custom detectors.

### Output metadata

```ts
{
  value: redactedValue,
  findings: [
    {
      path,
      detector,
      action,
      severity
    }
  ]
}
```

### CLI

```bash
agent-inspect-redact file.json --profile share
agent-inspect redact trace.jsonl --profile share
```

### Success criteria

- usable without AgentInspect tracing;
- same redaction engine powers trace writing, export, verify-safe, explain, and CI artifacts;
- no compliance claims;
- deterministic output.

---

# v2.2 — Test runners and CI workflow

## Goal

Make AgentInspect part of daily tests.

## Packages

```text
@agent-inspect/vitest
@agent-inspect/jest
```

If these were private in v1.8, this release should make them public and adoption-ready.

## Behavior

- failed test produces trace artifact;
- optional check/eval result attached;
- successful tests stay quiet by default;
- Markdown and HTML report on failure;
- JSON result for machines;
- GitHub Step Summary support;
- no GitHub App required;
- optional PR comments later.

## Example

```ts
import { traceTest } from "@agent-inspect/vitest";

test("refund agent", async (ctx) => {
  await traceTest(ctx, "refund-agent", async () => {
    await runRefundAgent();
  });
});
```

## Success criteria

- Failed agent tests leave useful artifacts.
- Original test failures are preserved.
- Reporters never mask application errors.
- Reporters are quiet by default on success.
- At least three real repos use reporter or CI artifact flow.

---

# v2.3 — Framework adapter hardening

## Goal

Make framework adoption genuinely low-friction.

## AI SDK

- first-class README path;
- Next.js route example;
- Node example;
- `streamText` example;
- tool-call example;
- no-network recipe;
- conformance fixtures;
- explicit privacy defaults.

## OpenAI Agents

- additional processor mode;
- replacement/local-only mode;
- agents;
- generations;
- tools;
- handoffs;
- guardrails;
- MCP spans where exposed;
- group/session metadata.

## LangGraph

Extend through existing LangChain package unless a separate package is clearly better.

Support:

- graph node identity;
- subgraph identity;
- checkpoint metadata;
- stream modes;
- parallel branches;
- handoffs.

## Mastra

Add only if demand is real.

Go condition:

- stable extension surface confirmed;
- at least two external users ask;
- one design partner validates.

## NestJS

Build only a pragmatic helper if harness docs are not enough.

Possible package:

```text
@agent-inspect/nestjs
```

Scope:

- bootstrap recipe;
- provider observation helper;
- testing-module helper;
- env-safe local runner pattern;
- no root Nest dependency.

---

# v2.4 — Sessions, multi-agent, MCP, and workflow causality

## Goal

Support real multi-run agent systems.

## Commands

```bash
agent-inspect sessions
agent-inspect session <sessionId>
agent-inspect session <sessionId> --timeline
agent-inspect search --session <sessionId>
agent-inspect search --correlation-id <id>
```

## Model

Support:

- session ID;
- conversation ID;
- group ID;
- parent group ID;
- run attempts;
- retries;
- handoffs;
- sub-agents;
- tool-call correlation;
- MCP client/server operations;
- job ID;
- queue name;
- workflow step.

## MCP

Package or subpath:

```text
@agent-inspect/mcp
```

Initial support:

- wrap MCP client calls;
- trace `tools/list`;
- trace `tools/call`;
- tool name;
- arguments summary;
- result summary;
- duration;
- errors;
- session metadata.

Do not build a gateway product.

---

# v2.5 — Guardrails and circuit breakers

## Goal

Add small optional utilities for repeated agent safety problems.

## Packages

```text
@agent-inspect/guardrails
@agent-inspect/circuit
```

## Guardrails

Built on top of `@agent-inspect/redact`.

Support:

- banned phrase;
- PII leak;
- unsafe tool arguments;
- prompt-injection pattern;
- structured output violation;
- oversize output;
- required JSON shape.

Guardrail results should emit trace events.

## Circuit

Support:

- repeated same tool call;
- repeated same tool arguments;
- max loop iterations;
- max retries;
- long-running tool timeout;
- runaway LLM loop;
- excessive branch width.

These should feed into `check` and `eval`.

---

# v2.6 — Optional viewer and IDE/MCP surfaces

## Local viewer

```bash
agent-inspect serve
```

Properties:

- localhost only;
- read-only;
- no upload;
- no root dependency;
- tree;
- timeline;
- reports;
- diff;
- check results;
- session browsing;
- safe sharing status.

## Read-only MCP server

```text
@agent-inspect/mcp-server
```

Expose:

- list traces;
- read trace;
- find first error;
- find slowest path;
- run checks;
- generate share-safe report.

Do not expose:

- trace mutation;
- tool invocation;
- unredacted data by default;
- replay;
- auto-fix.

## IDE

Consider Cursor/VS Code extension only if users ask for:

- click from trace to source;
- side-by-side trace and code;
- PR trace artifact review;
- baseline vs candidate in editor.

---

# v3.0 — Extensible local agent trace toolchain

v3 is conditional.

Proceed only when:

- v2 has retained users;
- external projects emit compatible traces;
- reporter/check workflows recur;
- at least one third-party adapter exists;
- users ask for extensibility rather than basic setup.

## v3 goal

Turn AgentInspect from a package family into a stable local trace-tooling ecosystem.

## Stable extension contracts

- `TraceSource`;
- `TraceReader`;
- `TraceWriter`;
- `TraceTransform`;
- `TraceCheck`;
- `TraceRenderer`;
- `TraceIndexer`;
- `TraceAdapter`;
- semantic extension fields;
- adapter registration.

## Product surfaces

- CLI;
- reporters;
- static reports;
- optional local viewer;
- read-only MCP;
- adapter SDK;
- conformance runner;
- third-party adapter registry.

## Still not v3 goals

- hosted SaaS;
- billing;
- prompt registry;
- dataset platform;
- production alerting platform;
- automatic production replay;
- automatic remediation;
- full APM replacement.

---

# What to stop or deprioritize

## Stop expanding core log parsing

Keep structured logs supported, but secondary.

Primary adoption path should become:

```text
framework telemetry → local trace
manual observe / inspectRun → local trace
standard trace input → local trace reader
```

Not:

```text
arbitrary app logs → parser heuristics
```

## Do not build a hosted dashboard

That would erase the strongest differentiation.

## Do not build a cost engine

Preserve token metadata when supplied. Do not maintain provider pricing tables.

## Do not build replay yet

Replay is attractive but unsafe and expansive. Consider only after checks/eval/reporters show recurring usage.

## Do not build many shallow adapters

Prefer:

```text
AI SDK excellent
OpenAI Agents good
LangGraph useful
Mastra only if demanded
NestJS harness support
```

over ten weak adapters.

---

# Adoption gates

## After v1.9

Expected:

- README quickstart completion in under five minutes.
- At least three external users try `observe()` or harness.
- At least one mature project uses harness or explain.
- AI SDK/OpenAI adapter issues shift from “how to set up?” to “can it capture X?”

## After v2.1

Expected:

- Three external projects use `@agent-inspect/eval` or reporters.
- At least one CI pipeline retains AgentInspect artifacts.
- Users ask for more assertions, not basic setup.

## After v2.3

Expected:

- AI SDK adapter becomes the highest-used optional package.
- OpenAI Agents adapter receives real issue reports.
- At least one community recipe or external blog post appears.

## Before v3

Required:

- clear retained usage;
- external adapters or recipes;
- repeated CI usage;
- product pull for extension points.

If those signals do not appear, narrow to the most-used adapter/workflow rather than expanding.

---

# Maintainer execution model

## Release trains

- Build in small, reviewable Cursor chunks.
- Publish fewer npm releases.
- Do not version-bump per chunk.
- Every release train must include docs alignment and release readiness.

## Required validation levels

### Docs-only

```bash
pnpm typecheck
pnpm test
git diff --check
```

### Fixtures/examples

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
pnpm recipes:check
```

### Runtime/core

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm pack:smoke
pnpm compat:smoke
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
npm pack --dry-run
```

## Release gate

Do not publish unless:

- README, ROADMAP, CHANGELOG, API, CLI, and schema docs are aligned;
- package versions are intentional;
- all public examples and recipes pass validation;
- old traces remain readable;
- no hidden network behavior exists;
- root dependencies remain approved;
- security and redaction docs match behavior;
- package smoke and compatibility smoke pass.

---

# Final recommendation

Do not jump from v1.8 directly to v2.0.

First ship an adoption-focused v1.9:

```text
observe-first docs
harness
explain
adapter promotion
```

Then do v2.0 as a clean contract reset.

Then build the standard utility triangle:

```text
trace + eval + redact
```

The winning product is:

> **The local-first toolkit for TypeScript AI agents: trace what happened, check what should have happened, and redact what should never leave your machine.**
