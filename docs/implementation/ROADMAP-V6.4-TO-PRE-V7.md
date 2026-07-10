# AgentInspect Canonical Pre-v7 Roadmap

**Status:** Canonical implementation roadmap proposal after the v6.4 audit  
**Audience:** Maintainers, Cursor sessions, contributors, adapter authors, Studio operators, and design partners  
**Current baseline:** `agent-inspect@6.7.0` (technical launch candidate on npm)  
**Persisted trace schema:** `1.0`  
**Roadmap horizon:** `v6.4.1 → v6.5 → v6.6 → v6.7 → v6.8 → conditional v7`  
**Primary goal:** Finish the trust, semantic correctness, team-workflow, interoperability, and launch-readiness work required before broad public adoption.  
**Exit condition:** After v6.8.0, enter an 8–12 week feature freeze. Only bugs, security, compatibility, performance regressions, and documentation fixes may ship until the v7 adoption gates are reviewed.

> **v7 is not scheduled.** Completing implementation is not enough. AgentInspect must first prove repeated external use of trace contracts, suites, CI gates, safe evidence bundles, Studio, MCP workflows, and extension points.

---

## 1. Executive decision

AgentInspect has already delivered the large v4–v6 roadmap:

```text
v4  local workspaces, optional indexing, sessions, bundles, observed outcomes
v5  trace suites, cohorts, CI gates, viewer modes, PM/QA templates
v6  self-hosted Studio, client-hosted ingestion, plugin conventions,
    MCP coding-agent workflows, and standards bridge work
```

The correct next phase is **not another expansion phase**.

The correct sequence is:

```text
trust
  ↓
semantic correctness
  ↓
product truth
  ↓
operational hardening
  ↓
interoperability proof
  ↓
golden-path launch candidate
  ↓
adoption freeze and measurement
  ↓
conditional v7 decision
```

The pre-v7 roadmap is therefore:

```text
v6.4.1  Critical trust, security, and first-use patch
v6.4.2  Reserved repair patch, only if post-publication verification requires it
v6.5.0  Typed trace contracts and semantic stabilization
v6.5.1  Consumer compatibility and release-evidence patch
v6.6.0  Studio, index, and suite productization
v6.6.1  Self-hosting and ingestion security patch
v6.7.0  Standards interoperability and MCP causality
v6.7.1  Interoperability evidence and claim-accuracy patch
v6.8.0  Golden-path launch candidate
v6.8.x  Feature freeze: security, correctness, compatibility, and docs only
v7.0.0  Conditional; scheduled only after adoption gates pass
```

The strongest product sentence remains:

> **AgentInspect is customer-owned evidence infrastructure for TypeScript AI-agent behavior: trace what happened, check what should have happened, redact what must not leave the machine, and package the evidence for local, CI, and self-hosted review.**

---

## 2. Current v6.4.0 baseline

AgentInspect now includes a broad local and self-hosted toolkit.

### 2.1 Core trace and inspection

- local JSONL trace capture
- stable schema `1.0` writer path
- v0.1 and v0.2 compatibility readers
- `inspectRun`
- `maybeInspectRun`
- `step`
- `step.tool`
- `step.llm`
- `observe`
- `observeOutcome`
- `createInspector`
- configurable readers and writers
- migration tooling
- tree rendering
- timeline
- search
- stats
- deterministic summaries
- Markdown and HTML reports
- structural diff

### 2.2 Safety and evidence

- metadata-only defaults
- redaction before persistence
- local/share/strict profiles
- event-size bounds
- `scan`
- `verify-safe`
- redacted exports
- CI artifacts
- share-safe bundles
- bundle metadata
- observed-outcome evidence

### 2.3 Evaluation and regression

- deterministic checks
- local eval heuristics
- guardrails
- circuit analysis
- trace suites
- cohort comparison
- CI quality gates
- Vitest reporter
- Jest reporter
- PM/QA suite templates

### 2.4 Framework and protocol integrations

- AI SDK adapter
- OpenAI Agents adapter
- LangChain and LangGraph-through-LangChain path
- MCP client tracing
- read-only MCP server
- log-to-tree ingestion
- OpenInference local read/export compatibility
- OTLP JSON local read/export compatibility

### 2.5 Local and team surfaces

- project-local workspace manifest
- optional SQLite trace index
- sessions and activity
- local viewer
- VS Code surface
- self-hosted Studio
- file-drop ingestion
- GitHub artifact import
- optional HTTP ingest
- plugin convention and validation
- adapter SDK

### 2.6 Architectural strengths to preserve

- JSONL remains durable source of truth
- indexes and databases remain derived and rebuildable
- SQLite remains optional and package-scoped
- no maintainer-hosted cloud
- no default upload
- no root framework dependencies
- no root OpenTelemetry SDK dependency
- root runtime dependencies remain lean
- no prompt registry
- no dataset platform
- no pricing engine
- no replay engine
- no automatic remediation

---

## 3. Evidence-backed gaps that drive this roadmap

The following are not speculative roadmap ideas. They are verified or strongly evidenced gaps in the current v6.4 implementation and public product story.

### 3.1 First-use trust gaps

- generated `.mjs` quickstart code can contain TypeScript-only syntax
- public quickstart commands can omit required positional arguments
- the release/version story can drift between manifests, README, website, CLI, and package docs
- monorepo validation is stronger than packed-consumer validation

### 3.2 Safety gaps

- MCP result paths need a single enforced redaction and bounding boundary
- share-safe bundle status must be derived from a real safety assessment, never hard-coded
- bundle filenames and imported artifact paths require final path-containment checks
- trace-derived HTML must not enter `innerHTML` unsafely
- plugin-manifest booleans and capture modes require strict type validation

### 3.3 Semantic truth gaps

- a suite with no usable evidence must not report pass
- trace-validation suites and executable suites must be clearly distinct
- cohort changes need tolerances, sample counts, and insufficient-evidence states
- invalid workspace manifests must not be silently replaced or adopted as valid
- one canonical normalized read contract must preserve source fidelity and mapping loss

### 3.4 Product truth gaps

- Studio must become a useful analyzer rather than a health-page shell
- imported Studio evidence must be classified, validated, normalized, indexed, and diagnosable
- the optional index needs incremental operation, richer fields, and scan-parity evidence
- preview/beta/stable labels must match actual maturity

### 3.5 Interoperability truth gaps

- standards validators need field-level semantics, not only top-level JSON shape checks
- resource attributes, instrumentation scope, trace/span IDs, links, events, and unknown extensions need preservation rules
- standards claims must name tested versions and known losses
- MCP tracing should distinguish protocol errors, tool errors, cancellation, progress, approvals, and transport events

### 3.6 Adoption-proof gaps

- no broad marketing push should begin before the packed golden path is proven
- Studio needs at least one real team trial
- typed contracts and CI gates need retained external use
- v7 extension/intelligence work requires ecosystem pull rather than implementation momentum

---

## 4. Product thesis and north star

### 4.1 Product thesis

AgentInspect is not another hosted observability platform.

AgentInspect should own this workflow:

```text
capture or import local evidence
          ↓
normalize without losing provenance
          ↓
inspect the causal execution path
          ↓
check deterministic trajectory expectations
          ↓
compare baseline and candidate behavior
          ↓
redact and verify derived artifacts
          ↓
review locally, in CI, or in customer-hosted Studio
```

### 4.2 Pre-v7 north star

> A TypeScript team can install AgentInspect, capture or import one real failed run, identify the causal failure, express the expected execution trajectory as a typed contract, fail that contract in CI, generate a verified-safe evidence bundle, and review it in customer-owned Studio—without sending data to AgentInspect or any maintainer-operated service.

### 4.3 Adoption north star

> Median time from clean install to a useful trace must remain below five minutes, and the next retained workflow must be a deterministic contract, suite, gate, bundle, or Studio review—not only a one-time trace view.

---

## 5. Product principles

### 5.1 Local-first by default

Default behavior remains:

```text
local files
local JSONL
local reports
local checks
local suites
local bundles
local viewer
localhost Studio
no upload
```

### 5.2 Customer-owned self-hosting only

Allowed:

- localhost viewer
- customer-hosted Studio
- customer-owned SQLite
- future customer-owned Postgres only after implementation exists
- customer-owned CI artifact import
- internal read-only MCP server
- explicitly configured standards bridge

Not allowed:

- AgentInspect-hosted SaaS
- maintainer-operated trace storage
- default remote collector
- multi-tenant cloud dashboard
- hidden usage telemetry

### 5.3 JSONL remains source of truth

- schema 1.0 JSONL is durable evidence
- v0.1 and v0.2 remain readable
- indexes are derived
- Studio databases are caches and registries
- reports are reproducible
- bundles are derived copies
- migrations are explicit and non-destructive

### 5.4 Safety is a product feature

Required pipeline:

```text
capture policy
   ↓
redaction and bounds
   ↓
local persistence
   ↓
safety assessment
   ↓
derived share-safe artifact
   ↓
verification before sharing
```

Safety language must remain careful:

- best-effort
- local
- deterministic
- not compliance certification
- not encryption
- not a guarantee that all PII is detected

### 5.5 Deterministic rules before model-assisted inference

Core checks, suites, gates, and contracts must remain deterministic.

Model-assisted explanation is optional and must never be required for:

- CI decisions
- contract pass/fail
- redaction
- safety classification
- migration
- standards validation

### 5.6 Standards are bridges

OpenInference and OpenTelemetry compatibility are important, but:

- AgentInspect schema stays independent
- root does not require an OTel SDK
- every standards mapping has a loss model
- every public compatibility claim names tested versions
- vendor-specific SDK matrices do not enter root/core

### 5.7 Preview surfaces must be labeled

A surface is not stable because it shipped.

Support levels must reflect evidence:

```text
Stable     contract guaranteed within major version
Supported  production-quality for local/CI use, additive changes allowed
Beta       useful, but semantics or workflow may still change
Preview    early product surface; external validation required
Experimental research or extension surface
```

### 5.8 No new broad package families before v7 review

Before the v7 gate, do not add:

- context optimization package
- browser-agent adapter family
- replay/cassette package
- additional broad framework adapter matrix
- semantic/vector search service
- hosted collaboration package
- LLM intelligence plugin family

---

## 6. Support-level model before v7

### Stable

- stable root tracing APIs
- schema 1.0 persisted trace contract
- v0.1/v0.2/schema 1.0 readers
- explicit migration
- reports
- timeline
- diff
- core deterministic checks
- redaction profiles and redacted-copy workflows
- readers/writers subpaths

### Supported

- AI SDK adapter
- OpenAI Agents adapter
- LangChain adapter
- Vitest/Jest reporters
- harness
- workspace
- bundles
- observed outcomes
- sessions
- eval utilities
- guardrails
- circuit analysis

### Beta

- trace suites
- cohort analysis
- CI gates
- optional SQLite index
- workspace/suite viewer modes
- plugin convention
- adapter SDK ecosystem workflows

### Preview

- self-hosted Studio
- Studio ingestion channels
- read-only MCP server
- standards round-trip interoperability
- network-bound Studio operation
- plugin discovery and external extension registry

Support levels must appear in:

- README package map
- package READMEs
- docs site
- CLI help where useful
- migration guide
- compatibility matrix
- release notes

---

## 7. Roadmap overview

| Release | Theme | Primary outcome |
| --- | --- | --- |
| **6.4.1** | Critical trust and security | No known release-blocking first-use, path, XSS, MCP-redaction, or false-safety defect |
| **6.4.2** | Reserved repair patch | Post-publication packaging/OS/docs repairs only, if required |
| **6.5.0** | Contract and semantic stabilization | Typed trajectory contracts and truthful suites/cohorts/workspaces |
| **6.5.1** | Compatibility and evidence | Clean consumer installs, platform matrix, accurate release evidence |
| **6.6.0** | Studio/index/suite productization | Team-facing surfaces match their product claims |
| **6.6.1** | Self-hosting security | Hardened authentication, ingestion, limits, and threat model |
| **6.7.0** | Standards and MCP interoperability | Field-level semantic mapping, round trips, and complete MCP causality |
| **6.7.1** | Claim-accuracy patch | Public compatibility claims match tested evidence |
| **6.8.0** | Golden-path launch candidate | One packed, externally validated, end-to-end product workflow |
| **6.8.x** | Adoption feature freeze | Security, correctness, compatibility, and documentation only |
| **7.0.0** | Conditional | Scheduled only after mandatory adoption gates pass |

---

# v6.4.1 — Critical Trust and Security Patch

## Goal

Remove every known issue that can make a first-time user lose trust, expose trace data unintentionally, misclassify unsafe evidence, or execute trace-provided content.

## Why this release comes first

Marketing a product with a broken quickstart or misleading share-safe status creates more damage than delaying outreach.

Before any minor train:

- the five-minute path must work from the packed artifact
- MCP output must be redacted and bounded
- bundle paths must be contained
- viewer/Studio rendering must be XSS-safe
- plugin and gate inputs must be strictly validated
- Studio initialization must be deterministic

## Scope 6.4.1-A — Packed first-use correctness

### Fix generated demo syntax

The custom `init` demo must be valid JavaScript if generated as `.mjs`.

Preferred behavior:

```js
import { observe } from "agent-inspect";

class DemoAgent {
  async run(input) {
    return { answer: `Echo: ${input.question}` };
  }
}
```

Do not generate TypeScript annotations in `.mjs`.

If future generated code requires TypeScript:

- generate `.ts`
- generate an explicit supported runner
- test that runner from the packed install

### Correct documented commands

Every README, website, starter, and generated next step must include valid required arguments.

For example:

```bash
npx agent-inspect verify-safe <run-id> --dir .agent-inspect
```

or:

```bash
npx agent-inspect verify-safe .agent-inspect/<trace>.jsonl
```

Do not document directory-only usage unless implemented and tested.

### Add packed five-minute E2E

Create a clean consumer test that:

```text
1. builds and packs agent-inspect
2. creates a temporary npm project
3. installs the tarball
4. runs npx agent-inspect init --yes
5. executes the generated demo
6. discovers the generated run ID
7. lists the run
8. views the run
9. generates a report
10. runs a deterministic check
11. creates a redacted derived artifact
12. verifies that artifact
13. exits successfully
```

Test against the installed tarball, not workspace imports.

### Add documentation-command verification

Create one of:

```text
scripts/validate-doc-commands.mjs
scripts/validate-quickstarts.mjs
```

It should validate or execute canonical quickstart commands against fixtures or a packed consumer project.

## Scope 6.4.1-B — MCP response safety boundary

### Add one mandatory MCP result preparer

Every read-only tool result must flow through:

```ts
prepareMcpToolResult({
  toolName,
  payload,
  redactionProfile,
  maxEvents,
  maxSerializedBytes,
});
```

It must:

- apply `share` or `strict` redaction
- enforce string/array/object-depth limits
- enforce event-count limits
- enforce total serialized byte limits
- include truncation diagnostics
- remove raw stack traces by default
- preserve safe evidence IDs
- fail closed when safety assessment cannot complete

### Apply to every MCP tool

Including:

```text
list_traces
read_trace
search_traces
find_first_error
find_slowest_path
compare_runs
run_checks
create_share_safe_report
summarize_failed_run
retrieve_decision_notes
find_failed_observation
create_share_safe_bundle
```

### Replace hard-coded SAFE metadata

`create_share_safe_bundle` must run the real safety assessor.

Allowed statuses:

```text
SAFE
SAFE WITH WARNINGS
UNSAFE
UNKNOWN
```

Default behavior:

```text
UNSAFE   → refuse share-safe result
UNKNOWN  → refuse share-safe result
SAFE WITH WARNINGS → return warnings and require user review
SAFE     → return result with real findings summary
```

No MCP tool may present safety certification language.

### Correct server version

Load MCP server version from its package metadata or generated build constant.

### MCP adversarial fixtures

Add fixtures for:

- API-key-like values
- bearer headers
- cookies
- emails
- nested sensitive values
- large arrays
- large objects
- malicious HTML
- sensitive error stacks
- failed observation evidence
- sensitive decision metadata

Assert that no known fixture secret appears in serialized MCP responses.

## Scope 6.4.1-C — Bundle path containment

### Add one safe artifact resolver

```ts
resolveBundleArtifactPath(outputDir, relativePath)
```

It must:

- resolve both base and final path
- reject absolute paths
- reject `..` escape
- reject NUL characters
- reject Windows drive/UNC escape
- normalize separators
- verify final path is inside `outputDir`
- defend against symlink escape where feasible

### Add safe artifact IDs

Do not use raw run IDs as filenames.

```ts
interface BundleRunReference {
  runId: string;
  artifactId: string;
}
```

Use `artifactId` for files and preserve `runId` in metadata.

### Apply containment everywhere

- per-run JSONL
- per-run HTML
- summary files
- bundle indexes
- Studio bundle extraction
- CI artifact folders
- imported bundle content

### Path-security test corpus

Test:

```text
../escape
../../outside
/absolute/path
C:\absolute
..\windows
encoded separators
very long ids
Unicode slash lookalikes
reserved Windows names
symlinked output paths
```

## Scope 6.4.1-D — Viewer and Studio XSS hardening

### Rendering rules

Never interpolate trace-derived strings into `innerHTML`.

Use:

- `textContent`
- DOM node construction
- a central escape helper
- sanitized markdown renderer where needed
- a strict Content Security Policy

### Required attack corpus

Inject through:

- suite name
- case ID
- case message
- tool name
- observation name
- diagnostics
- workspace project name
- run name
- model/provider
- bundle hint
- imported artifact metadata

Example:

```html
<img src=x onerror="globalThis.__agentInspectXss = true">
```

The test must prove no code executes.

### Shared safe-rendering module

Viewer and Studio should reuse one internal safe-rendering boundary.

## Scope 6.4.1-E — Strict plugin manifest validation

### Boolean fields

Accept only JSON booleans.

Reject:

```json
{ "networkAllowed": "false" }
```

### Capture modes

Validate an explicit enum:

```text
metadata-only
preview
full
custom
```

### Scoped package names

Allow safe scoped forms:

```text
@scope/agent-inspect-adapter-*
@scope/agent-inspect-plugin-*
@scope/agent-inspect-renderer-*
@scope/agent-inspect-check-*
@scope/agent-inspect-importer-*
```

### Additive permission declarations

```ts
interface PluginCapabilities {
  readsTraceData?: boolean;
  writesFiles?: boolean;
  networkAccess?: boolean;
  rendersHtml?: boolean;
  executesCode?: boolean;
}

interface PluginPermissions {
  filesystem?: "none" | "read" | "write";
  network?: "none" | "explicit";
}
```

Validate inconsistent declarations and produce explicit warnings.

## Scope 6.4.1-F — Gate threshold validation

### Error rate

Canonical internal representation:

```text
0.0–1.0
```

CLI may accept:

```bash
--max-error-rate 0.05
--max-error-rate 5%
```

Reject:

- negative values
- values above one without percent syntax
- NaN
- Infinity
- empty values

### Duration

Require positive finite durations.

Prefer consistent duration syntax:

```bash
--max-p95-duration 10s
```

Retain documented numeric milliseconds only where needed for compatibility.

### Other limits

Validate all numeric gate/check inputs:

- retries
- steps
- tool calls
- LLM calls
- tokens
- depth
- percentages
- sample sizes

## Scope 6.4.1-G — Studio initialization and capability truth

### Await directory creation

Studio must create/await the database parent directory before SQLite open.

### Reject unsupported Postgres

Until implemented:

- fail immediately on Postgres URLs
- do not advertise Postgres as supported
- remove Postgres examples
- state SQLite-only support

### Keep Studio Preview

Do not describe Studio as a complete team analyzer until v6.6.0.

## Scope 6.4.1-H — Public truth cleanup

Update:

- README version
- package count
- website current version
- CLI version
- MCP server version
- package map
- changelog
- roadmap current train
- support labels
- standards terminology

Prefer generated or checked values.

## v6.4.1 implementation chunks

```text
6.4.1-0   Confirm audit findings and threat model
6.4.1-1   Fix generated demo and packed five-minute E2E
6.4.1-2   Add MCP result-preparation boundary
6.4.1-3   Replace hard-coded bundle safety status
6.4.1-4   Add safe bundle artifact paths and IDs
6.4.1-5   Harden viewer and Studio rendering
6.4.1-6   Make plugin manifest parsing strict
6.4.1-7   Validate gate/check numeric ranges
6.4.1-8   Fix Studio mkdir/version/capability behavior
6.4.1-9   Add adversarial security fixture corpus
6.4.1-10  Align public version/support claims
6.4.1-11  Release readiness and packed publication verification
```

## v6.4.1 validation

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm size
pnpm perf:baseline
pnpm pack:smoke
pnpm compat:smoke
pnpm website:typecheck
pnpm website:build
npm pack --dry-run
git diff --check
```

Focused suites:

```bash
pnpm --filter @agent-inspect/mcp-server test
pnpm --filter @agent-inspect/viewer test
pnpm --filter @agent-inspect/studio test
pnpm --filter @agent-inspect/adapter-sdk test
```

## v6.4.1 release gate

- packed quickstart succeeds
- no known MCP raw-data bypass
- no hard-coded share-safe classification
- no bundle path escape
- no trace-derived XSS path
- plugin booleans/enums are strict
- invalid thresholds fail clearly
- Studio starts in a clean workspace
- README/website/CLI/manifests agree
- no new default network behavior
- no trace schema change

---

# v6.4.2 — Reserved Repair Patch

## Goal

Provide one reserved patch slot for post-6.4.1 verification only.

## Allowed scope

- packaged-file omission
- broken npm README link
- incorrect generated version
- Windows path regression
- native SQLite install regression
- optional peer-dependency message
- docs command typo
- security regression
- compatibility regression

## Prohibited scope

- new feature
- new public API
- new package
- new adapter
- schema change
- Studio product expansion

Skip v6.4.2 entirely when no repair is required.

---

# v6.5.0 — Typed Trace Contracts and Semantic Stabilization

## Goal

Make AgentInspect’s checks, suites, cohorts, workspaces, and adapters precise enough for dependable CI and team workflows.

## Product wedge

> **Typed execution contracts for agent trajectories.**

AgentInspect should evaluate the actions and intermediate behavior of an agent, not only final output text.

## Scope 6.5.0-A — Public trace contracts

### API

Add to `agent-inspect/checks` or a dedicated documented subpath:

```ts
import { defineTraceContract, evaluateTraceContract } from "agent-inspect/checks";

const contract = defineTraceContract({
  run: {
    requireCompleted: true,
    allowedStatuses: ["success"],
    maxDurationMs: 5_000,
  },

  tools: {
    required: ["retrievePolicy"],
    forbidden: ["deleteAccount"],
    maxCalls: 6,
    requiredOrder: ["classifyIntent", "retrievePolicy", "generateAnswer"],
  },

  llm: {
    maxCalls: 3,
    maxTotalTokens: 8_000,
    allowedModels: ["gpt-5-mini"],
  },

  observations: {
    required: ["policyDisplayed"],
    failOn: ["failed", "unknown"],
  },
});

const result = await evaluateTraceContract(trace, contract);
```

### Run rules

- completion required
- allowed status
- maximum duration
- maximum depth
- maximum event count
- no orphan events
- no invalid parent cycles
- no incomplete spans
- no unresolved running events

### Tool rules

- required tools
- forbidden tools
- allowed-tool list
- maximum total calls
- maximum calls per tool
- required order
- forbidden order
- expected parent
- allowed parallel group
- argument subset
- argument regex
- caller-provided JSON/schema validator

### LLM rules

- allowed models
- allowed providers
- maximum call count
- token budgets
- finish-reason restrictions
- retrieval before generation
- guardrail before final response
- no generation after failed approval

### Workflow rules

- allowed handoffs
- maximum handoffs
- maximum retries
- maximum rounds
- required decision metadata
- required approval step
- expected session continuity
- expected group/correlation continuity

### MCP rules

- allowed server identities
- allowed tools
- maximum calls
- no protocol failure
- no tool `isError`
- approval required before sampling/elicitation where configured
- expected cancellation handling

### Safety rules

- required redaction profile
- no unsafe safety findings
- maximum serialized payload
- no full prompt/output capture unless allowed
- share-safe bundle status required

### Stable finding format

```ts
interface TraceContractFinding {
  ruleId: string;
  status: "pass" | "fail" | "warn" | "skip";
  message: string;
  expected?: unknown;
  actual?: unknown;
  eventIds?: string[];
  runId?: string;
  sourcePath?: string;
}
```

Every failed contract must provide evidence.

## Scope 6.5.0-B — Vitest and Jest matchers

### API

```ts
await expectTrace(trace).toSatisfyTraceContract(contract);
await expectTrace(trace).toUseTool("retrievePolicy");
await expectTrace(trace).not.toUseTool("deleteAccount");
await expectTrace(trace).toHaveObservation("policyDisplayed");
await expectTrace(trace).toStayWithinBudget({ maxDurationMs: 5_000 });
```

### Requirements

- preserve original test failures
- deterministic output
- no model call
- no network call
- link findings to event IDs
- include artifact paths when reporters are enabled
- quiet success mode

## Scope 6.5.0-C — Truthful suite semantics

### Separate modes

#### Existing-evidence validation

```bash
agent-inspect suite validate
agent-inspect suite report
```

#### Fresh executable trajectory

```bash
agent-inspect suite run --runner ./agent-inspect.runner.ts
```

### Evidence policy

```ts
evidencePolicy: "fail" | "warn" | "skip";
```

Recommended default:

```text
CLI/CI = fail
```

Rules:

- all-missing suites cannot pass
- skipped cases affect aggregate result
- missing trace is non-zero by default
- `--allow-no-evidence` must be explicit
- reports show trace source and freshness
- executable suites link each case to a fresh run ID

### Freshness

Optional:

```ts
maxEvidenceAgeMs
```

## Scope 6.5.0-D — Tolerance-aware cohort semantics

### Threshold API

```ts
thresholds: {
  errorRate: { absoluteIncrease: 0.02 },
  duration: { percentageIncrease: 20 },
  tokenUsage: { percentageIncrease: 15 }
}
```

### Required comparison context

- baseline count
- candidate count
- missing-value count
- minimum sample warning
- p50
- p95
- absolute delta
- percentage delta

### Comparison states

```text
pass
regression
improvement
changed
insufficient-evidence
not-comparable
```

Do not classify every positive numeric delta as regression.

## Scope 6.5.0-E — Workspace semantic corrections

### Invalid manifests

Do not silently replace invalid manifests.

Return:

```text
manifest-invalid
```

Provide explicit recovery:

```bash
agent-inspect workspace doctor
agent-inspect workspace init --repair
agent-inspect workspace init --force-new
```

Never overwrite without user action.

### Correct counts

- bundles count bundle directories
- reports count supported report files
- artifacts count artifact sets
- notes count note files

### Trace readability

Workspace doctor must:

- open representative traces
- validate format
- report unreadable files
- report unsupported schema
- report mixed formats
- report stale/corrupt index
- remain read-only

## Scope 6.5.0-F — Canonical normalized read envelope

Do not add another persisted wire format.

Add an internal/public-low-level envelope:

```ts
interface NormalizedTraceEnvelope {
  source: {
    format: string;
    framework?: string;
    frameworkVersion?: string;
    adapter?: string;
    adapterVersion?: string;
    semanticConvention?: string;
  };

  events: AgentEvent[];
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
  preservedExtensions: Record<string, unknown>;
}
```

Goals:

- preserve provenance
- preserve framework/adapter versions
- preserve unknown standard attributes
- report lossy mapping
- preserve source policy metadata
- keep schema 1.0 canonical

## Scope 6.5.0-G — Crash and concurrency robustness

Add tests for:

- overlapping runs
- independent inspector instances
- concurrent bundle generation
- parallel index reads
- abrupt process termination
- truncated final JSONL line
- duplicate event IDs
- buffered queue overflow
- shutdown flush
- writer failure
- mixed valid/corrupt directory
- streaming cancellation
- serverless-style process completion

Instrumentation must never replace an application error.

## v6.5.0 implementation chunks

```text
6.5-0   Contract and support-level RFC
6.5-1   TraceContract type system and validation
6.5-2   Run/tool/LLM rules
6.5-3   Workflow/MCP/safety rules
6.5-4   Stable findings and renderers
6.5-5   Vitest matcher
6.5-6   Jest matcher
6.5-7   Suite evidence policy and truthful aggregation
6.5-8   Harness-backed executable suite mode
6.5-9   Cohort thresholds and sample diagnostics
6.5-10  Workspace manifest/count/doctor corrections
6.5-11  Normalized source envelope and loss reporting
6.5-12  Crash/concurrency corpus
6.5-13  Docs, recipes, and migration notes
6.5-14  Release readiness
```

## v6.5.0 release gate

- contracts work across all supported trace inputs
- every failed rule includes evidence
- all-missing suites cannot pass
- cohorts use explicit tolerances
- insufficient samples are labeled
- invalid workspaces are never silently rewritten
- no new persisted schema
- v0.1/v0.2/1.0 remain readable
- no default network behavior

---

# v6.5.1 — Consumer Compatibility and Release Evidence

## Goal

Prove the package family works as installed by users across supported environments.

## Scope 6.5.1-A — Consumer matrix

Test clean installs for:

```text
Node 20
Node 22
Node 24
ESM
CommonJS
TypeScript NodeNext
TypeScript Node16
Vitest
Jest
Linux
macOS
Windows
```

Include:

- `@agent-inspect/index-sqlite`
- `@agent-inspect/studio`
- adapters
- reporters
- harness
- adapter SDK
- VS Code packaging

## Scope 6.5.1-B — Per-package tarball E2E

For each public package:

- build tarball
- install into clean project
- import documented entry point
- execute minimal supported flow
- typecheck consumer code
- verify no workspace-only dependency
- verify README inclusion
- verify peer-dependency guidance

## Scope 6.5.1-C — Release evidence

Every release-readiness document must include exact values:

- versions
- public package list
- test count
- test-file count
- skipped tests
- coverage
- tarball sizes
- root runtime size
- performance delta
- Node/OS matrix
- recipe count
- fixture count
- security-suite result
- provenance status
- known limitations

## Scope 6.5.1-D — Generated consistency checks

CI should compare:

- README version
- website version
- CLI version
- MCP server version
- package map
- package count
- documented subpaths
- documented commands
- release state

## Release gate

No runtime feature is required. Publish only when packaging, compatibility, or public evidence changed.

---

# v6.6.0 — Studio, Index, and Suite Productization

## Goal

Make team-facing surfaces match their names and public claims.

At v6.6.0:

> Studio must become a useful read-only analyzer rather than a health-page shell.

Studio remains **Beta** until a real design partner completes a trial.

## Scope 6.6.0-A — Minimum complete Studio UI

### Projects page

Show:

- project name
- workspace path
- trace count
- suite count
- latest activity
- safety warnings
- index status
- import status

### Runs page

Show:

- run ID
- name
- status
- start time
- duration
- session
- source adapter
- model/provider
- first error
- failed observations
- guardrail/circuit findings

### Run detail

Show:

- summary
- tree
- timeline
- first failure
- slowest path
- tool path
- LLM path
- token metadata
- observed outcomes
- trace-contract/check results
- redaction status
- source/provenance
- bundle/export actions

### Sessions page

Show:

- grouped runs
- handoffs
- retries/attempts
- activity
- last error
- stale status
- correlation metadata

### Suites page

Show:

- validation vs executable mode
- suite status
- case status
- evidence source
- evidence freshness
- missing/skipped/error distinction
- contract findings
- cohort comparison
- imported CI artifacts

### Safety page

Show:

- redaction profile
- scan status
- findings
- unsafe fields
- bundle status
- review warning

### Imports page

Show:

- source
- channel
- imported files
- duplicates
- rejected files
- quarantine state
- unsupported format
- safety classification
- import warnings

## Scope 6.6.0-B — Shared safe rendering

Requirements:

- no untrusted `innerHTML`
- centralized escaping
- strict CSP
- bounded API responses
- no external assets by default
- safe URLs
- no raw stacks by default
- viewer and Studio share tests/helpers

## Scope 6.6.0-C — Analyzable imports

Every import must:

```text
classify
validate
normalize
index
preserve provenance
record warnings
quarantine failures
expose diagnostics
```

Explicit categories:

```text
AgentInspect trace
share-safe bundle
CI artifact set
OpenInference JSON
OTLP JSON
unsupported
```

## Scope 6.6.0-D — Local index v2

### Incremental indexing

Track:

- path
- mtime
- size
- hash when needed
- schema version

Re-index changed files only.

### Richer fields

Index:

- source adapter/framework/version
- model/provider
- session/group/correlation/job IDs
- observed outcomes
- decision summary
- guardrail failures
- circuit violations
- redaction warnings
- token counts
- error codes
- import source

### Query completeness

Every query reports:

```text
complete
partial
stale
fallback-scan
```

### Scan parity

Canonical fixtures must produce equivalent results through:

- directory scan
- SQLite index

for:

- run list
- sessions
- search
- stats
- failed outcomes
- tool filters
- correlation queries

## Scope 6.6.0-E — Suite operational truth in Studio

Distinguish:

```text
existing-trace validation
fresh harness-backed execution
historical result
CI-imported result
```

Never imply fresh execution occurred when validating stored evidence.

## Scope 6.6.0-F — Self-hosted example

Provide a customer-owned Docker Compose example using SQLite.

Requirements:

- localhost by default
- explicit network binding
- no hidden external services
- persisted volume
- backup guidance
- no unsupported Postgres claim

## v6.6.0 implementation chunks

```text
6.6-0   Studio route/UI/product contract
6.6-1   Shared safe renderer and CSP
6.6-2   Projects and runs pages
6.6-3   Run-detail tree/timeline/check/safety pages
6.6-4   Sessions page
6.6-5   Suites/cohorts/evidence pages
6.6-6   Import classification and diagnostics
6.6-7   Incremental index
6.6-8   Rich index fields
6.6-9   Scan/index parity corpus
6.6-10  Bundle and safety workflows
6.6-11  Docker Compose example
6.6-12  Design-partner acceptance run
6.6-13  Docs and capability matrix
6.6-14  Release readiness
```

## v6.6.0 release gate

- Studio has useful projects/runs/sessions/suites/import pages
- no trace-derived XSS path
- imports are classified and diagnosable
- failed imports are visible
- index parity passes
- SQLite is the only claimed database
- localhost remains default
- one design partner completes a Studio trial
- Studio remains Beta publicly

---

# v6.6.1 — Self-hosting and Ingestion Security

## Goal

Make explicit customer-hosted network use defensible before public promotion.

## Scope 6.6.1-A — Threat model

Document:

- trusted administrator
- untrusted trace
- compromised CI artifact
- malicious archive
- stolen ingest token
- exposed port
- reverse-proxy misconfiguration
- path traversal
- oversized input
- plugin supply-chain risk
- denial-of-service input

## Scope 6.6.1-B — HTTP ingest hardening

Add:

- strict content types
- body-size limit
- file-count limit
- request timeout
- concurrency limit
- rate limit
- archive expansion limit
- compression-ratio limit
- path containment
- quarantine
- checksum
- duplicate detection
- failed-ingest audit records

## Scope 6.6.1-C — Token management

Support:

- token ID
- hashed token storage when persisted
- creation
- rotation
- revocation
- expiry
- ingest-only scope
- audit record

Never log raw tokens.

## Scope 6.6.1-D — Authentication and binding

- `--server` required for non-localhost bind
- warning/error when auth is absent on network bind
- basic auth limitations documented
- reverse-proxy TLS guidance
- unsupported auth modes fail clearly
- secure Docker Compose example

## Scope 6.6.1-E — Backup and recovery

Document:

- workspace backup
- Studio DB backup
- import backup
- JSONL rebuild
- index rebuild
- restore verification

## Scope 6.6.1-F — Security regression corpus

Test:

- malformed multipart
- archive bomb
- traversal
- oversized JSON
- slow body
- concurrent requests
- invalid token
- revoked token
- duplicate import
- malicious bundle metadata
- malicious HTML
- symlink escape

## Release gate

- no critical/high finding remains
- localhost default unchanged
- ingest disabled by default
- network mode explicit
- threat model published
- corpus in CI

---

# v6.7.0 — Standards Interoperability and MCP Causality

## Goal

Make standards and MCP claims executable, field-level, versioned, and testable.

Public terminology:

```text
AgentInspect-native
OpenInference-compatible
OTel GenAI-aligned
verified against named versions
```

Avoid unqualified “compliant.”

## Scope 6.7.0-A — Field-level mapping

Map and document:

- run/agent
- chain/workflow
- LLM
- streaming LLM
- tool
- retriever
- reranker
- embedding
- guardrail
- evaluator
- prompt
- error
- observed outcome
- session/group
- MCP operation

For every field:

```text
AgentInspect field
OpenInference field
OTel field
direction
lossless/lossy
unsupported behavior
```

## Scope 6.7.0-B — Preserve standard structure

Preserve when present:

- trace ID
- span ID
- parent span ID
- links
- events
- status
- resource attributes
- instrumentation scope
- service metadata
- framework metadata
- unknown extension attributes
- semantic-convention version

Lost fields must appear in a loss report.

## Scope 6.7.0-C — Round-trip conformance

Test:

```text
AgentInspect → OpenInference → AgentInspect
AgentInspect → OTLP JSON → collector-compatible payload
External OpenInference/OTLP fixture → AgentInspect → export
```

Compare semantic equivalence:

- hierarchy
- kinds
- timing
- status
- tools
- model/provider
- tokens
- errors
- sessions
- links
- outcomes where mappable
- unknown extensions

## Scope 6.7.0-D — Real integration verification

Maintain tested-version entries for:

- OpenTelemetry Collector
- Phoenix/OpenInference
- one generic OTLP receiver
- Langfuse OTLP path where verified

Every entry records:

```text
tested version
test date
supported path
known losses
manual/automated
```

## Scope 6.7.0-E — Optional OTel bridge gate

Consider `@agent-inspect/otel` only when:

- one design partner needs an in-process path
- file import/export is insufficient
- root remains OTel-free
- flush/shutdown semantics are clear
- privacy defaults are metadata-only

Otherwise defer.

## Scope 6.7.0-F — Complete MCP causality

Represent:

- client and server
- initialize
- tools/list
- tools/call
- resources
- prompts
- protocol error
- tool `isError`
- progress
- cancellation
- logging notification
- elicitation
- sampling
- user approval
- transport connect/disconnect
- reconnect/retry
- server identity
- session identity
- trace propagation

Target relationship:

```text
agent run
  → MCP client request
    → MCP server operation
      → tool execution
        → observed outcome
```

Where only one side exists, record confidence.

## Scope 6.7.0-G — MCP conformance corpus

Fixtures:

- successful tool
- tool `isError`
- protocol error
- timeout
- cancellation
- progress
- sampling approval
- elicitation
- reconnect
- sensitive arguments
- sensitive result
- malformed server response

MCP server output must remain redacted and bounded.

## Scope 6.7.0-H — Emerging format decision gate

Evaluate formats such as ATIF only through an RFC covering:

- ecosystem adoption
- unique data
- overlap with OTel/OpenInference
- round-trip loss
- maintenance burden
- design-partner demand

No implementation without a concrete need.

## v6.7.0 implementation chunks

```text
6.7-0   Standards support-level and mapping RFC
6.7-1   Resource/scope/link/event preservation
6.7-2   OpenInference semantic fixtures
6.7-3   OTLP semantic fixtures
6.7-4   Round-trip conformance harness
6.7-5   Collector/Phoenix verification
6.7-6   Optional OTel bridge decision
6.7-7   MCP error/event model
6.7-8   MCP progress/cancel/approval causality
6.7-9   MCP conformance/privacy corpus
6.7-10  Compatibility matrix and loss reports
6.7-11  Release readiness
```

## v6.7.0 release gate

- field-level mapping documented
- round-trip tests pass
- one Collector and one Phoenix path verified
- public claims name tested versions
- MCP protocol/tool errors distinct
- MCP responses redacted
- no root OTel dependency
- no default vendor upload

---

# v6.7.1 — Interoperability Evidence and Claim Accuracy

## Goal

Make public messaging exactly match tested interoperability evidence.

## Scope

Update:

- README
- website
- standards docs
- package READMEs
- comparison docs
- compatibility matrix
- changelog
- release notes
- npm descriptions where useful

Preferred language:

```text
verified with
fixture-backed
semantic mapping
known lossy fields
preview bridge
```

Remove or qualify:

```text
compliant
works with every backend
production-ready exporter
universal support
```

Submit verified integrations to framework/community listings only after tests and docs are complete.

---

# v6.8.0 — Golden-Path Launch Candidate

## Goal

Turn the mature codebase into one compelling, packed, externally validated product story.

No new package family is allowed in v6.8.0.

## Scope 6.8.0-A — Canonical agent scenario

Create one deterministic scenario, recommended:

```text
customer-support / refund-policy agent
```

Include:

- intent classification
- retrieval
- tool call
- optional MCP call
- guardrail
- LLM response
- observed outcome
- intentional broken flow
- fixed flow
- baseline/candidate labels
- session metadata
- decision metadata

Example failure:

```text
refund is issued before identity verification
```

Typed contract:

```text
identityVerified observation must pass before issueRefund tool
```

## Scope 6.8.0-B — Multiple entry points

Implement the same logical scenario through:

- manual/observe
- AI SDK
- OpenAI Agents
- LangChain/LangGraph
- MCP fixture
- imported OpenInference/OTLP fixture

Default path requires no API key.

## Scope 6.8.0-C — Complete golden workflow

```bash
npx agent-inspect init --yes
npm run demo:broken
npx agent-inspect what <broken-run>
npx agent-inspect report <broken-run>
npx agent-inspect timeline <broken-run>
npx agent-inspect check <broken-run> --contract agent-inspect.contract.ts
npx agent-inspect suite run --runner agent-inspect.runner.ts
npx agent-inspect gate --suite agent-inspect.suite.ts
npm run demo:fixed
npx agent-inspect diff <broken-run> <fixed-run>
npx agent-inspect cohort --baseline before --candidate after
npx agent-inspect bundle <fixed-run> --profile share
npx agent-inspect verify-safe <bundle-artifact>
npx agent-inspect studio
```

Every command must be tested from a packed install.

## Scope 6.8.0-D — Task-oriented documentation

Organize top-level docs around:

```text
Start
Capture
Inspect
Prevent regressions
Share safely
Work with teams
Integrate frameworks
Extend AgentInspect
Self-host
Reference
```

Required start pages:

- first trace in five minutes
- debug one failed run
- prevent one regression in CI
- create one safe bundle
- import one external trace
- run one suite
- start Studio locally

## Scope 6.8.0-E — Agent-readable documentation

Generate:

- `llms.txt`
- CLI manifest
- API manifest
- package map
- compatibility matrix
- support-level matrix

Generate from source where possible.

## Scope 6.8.0-F — Launch presentation

Produce only assets that show shipped behavior:

- current screenshots
- 90-second demo
- three-minute technical demo
- architecture diagram
- security model diagram
- CI contract flow
- Studio Beta preview
- comparison page
- case-study template
- design-partner guide

No mocked UI that differs from the product.

## Scope 6.8.0-G — Quiet design-partner pilot

Onboard at least three external teams.

Track:

- time to first trace
- time to first useful failure
- first contract
- first CI gate
- first bundle
- first Studio review
- setup failures
- trust questions
- retained use after 30 days

At least one team tests:

- framework adapter
- CI gate
- Studio
- safe bundle

Pilot findings should create bug/docs issues, not immediate new package families.

## Scope 6.8.0-H — Release quality

Publish one coherent umbrella release with:

- concise summary
- install command
- golden demo
- compatibility table
- support levels
- security boundaries
- known limitations
- migration notes
- package list
- provenance status
- truthful design-partner status

## v6.8.0 implementation chunks

```text
6.8-0   Golden scenario and contract
6.8-1   Manual/observe scenario
6.8-2   AI SDK/OpenAI/LangChain variants
6.8-3   MCP and standards fixtures
6.8-4   Broken/fixed baseline flow
6.8-5   Packed golden-path E2E
6.8-6   Task-oriented docs reorganization
6.8-7   Generated agent-readable manifests
6.8-8   Current screenshots and demos
6.8-9   Design-partner pilot
6.8-10  Pilot fixes
6.8-11  Release readiness and provenance
```

## v6.8.0 release gate

- packed golden path passes
- no known critical/high security issue
- no false-green suite/gate path
- no raw MCP data leak
- no bundle traversal
- viewer/Studio XSS-safe
- one standards round trip verified
- three design partners complete trial
- one external CI contract workflow retained
- one Studio trial completed
- docs/website match commands
- no hidden network behavior

---

# v6.8.x — Adoption Feature Freeze

## Duration

Eight to twelve weeks after v6.8.0.

## Allowed work

- security fix
- correctness fix
- compatibility fix
- packaging fix
- upstream adapter compatibility
- performance regression
- accessibility fix
- documentation correction
- design-partner blocker
- release/provenance fix

## Prohibited without roadmap review

- new package family
- new framework adapter
- hosted service
- replay
- context optimization
- browser-agent package
- intelligence plugin family
- marketplace automation
- new trace schema
- broad API redesign

---

# Adoption Program During the Freeze

## Activation metrics

- install to first trace
- first trace to useful failure
- first trace to contract
- first contract to CI gate
- first safe artifact
- first Studio review

Target:

```text
median first useful trace < 5 minutes
```

## Retention metrics

- active after 7 days
- active after 30 days
- repeated trace inspection
- repeated contract/check use
- repeated suite use
- repeated bundle creation
- retained Studio use

## Ecosystem metrics

- external adapter/plugin
- external recipe/article
- public dependent repository
- MCP workflow
- standards round trip
- issue quality shifts from setup to deeper workflow requests

## Privacy-respecting measurement

Do not add hidden telemetry.

Use:

- design-partner interviews
- opt-in surveys
- public code search
- npm package trends
- GitHub dependents
- external issues/PRs
- optional local usage report explicitly shared by user

---

# Conditional v7 Entry Gate

v7 remains unscheduled until every mandatory gate passes.

## Mandatory gates

```text
[ ] 10 unrelated teams achieve first useful trace
[ ] 5 teams remain active after 30 days
[ ] 3 retained CI contract/suite workflows
[ ] 1 real Studio deployment
[ ] 1 external adapter or plugin
[ ] 1 repeated MCP/coding-agent workflow
[ ] 1 external standards round trip
[ ] users request v7-level extensibility/intelligence
[ ] no unresolved critical/high security issue
[ ] support and compatibility matrices are current
```

## Decision outcomes

### All gates pass

Open a new v7 discovery/RFC phase.

Candidate areas may include:

- local-only trace intelligence plugins
- workflow analyzers
- browser-agent analyzers
- context optimization research
- enterprise self-hosted packaging
- external extension ecosystem

### Partial gates pass

Continue v6.x hardening around the strongest retained workflow.

### Gates do not pass

Do not build v7.

Narrow investment to the strongest wedge, likely:

- typed trajectory contracts and CI gates
- AI SDK/OpenAI local debugging
- safe evidence bundles
- self-hosted team evidence

Do not compensate for weak adoption by building SaaS.

---

# Cross-Cutting Architecture Decisions

## Trace schema

- schema 1.0 remains canonical
- v0.1/v0.2 remain readable
- no new persisted schema before v7 review
- additive extension fields are allowed
- migration remains explicit and non-destructive

## Root dependency policy

Keep root runtime dependencies lean.

Framework, SQLite, Studio, OTel, viewer, and testing dependencies remain optional/package-scoped.

## Network policy

- no default network
- network behavior requires explicit command/config
- Studio localhost by default
- ingest disabled by default
- cloud model explain requires explicit provider
- standards bridge requires explicit endpoint/config

## Safety policy

Redaction occurs:

```text
before disk where configured
before export
before bundle
before MCP response
before model-assisted explanation
before remote standards transmission
```

## Evidence policy

Every derived artifact should carry:

- source trace IDs
- schema version
- AgentInspect version
- capture policy
- redaction profile
- safety status
- warnings
- source provenance
- generated timestamp

## Product claim policy

Do not claim:

- compliance certification
- universal backend support
- production APM
- high availability
- Postgres support before implementation
- statistical significance without analysis
- fresh suite execution without fresh evidence

---

# Regression Matrix

## Trace compatibility

- v0.1 read
- v0.2 read
- schema 1.0 read/write
- mixed directory
- migration dry-run
- non-destructive migration
- unknown additive fields
- malformed final line

## Runtime

- nested runs
- parallel runs
- application error preservation
- writer error isolation
- flush/close idempotence
- queue overflow
- process shutdown
- no hidden network

## Safety

- secret patterns
- nested sensitive values
- large payload
- malicious run IDs
- path traversal
- symlink escape
- malicious HTML
- unsafe MCP result
- unsafe bundle
- plugin permission mismatch
- archive bomb

## CLI

- documented quickstart
- human output
- JSON output
- exit codes
- missing arguments
- invalid thresholds
- unsupported format
- large-directory warnings

## Packages

- ESM
- CommonJS
- NodeNext
- Node16
- npm
- pnpm
- Node 20
- Node 22
- Node 24
- Linux
- macOS
- Windows
- missing optional peer
- native SQLite install

## UI

- viewer XSS corpus
- Studio XSS corpus
- empty state
- malformed API
- partial data
- large data
- accessibility basics
- offline assets

## Standards

- OpenInference import/export
- OTLP import/export
- resource/scope preservation
- links/events preservation
- loss report
- collector smoke
- Phoenix smoke

## Team workflow

- workspace adoption
- index rebuild
- session view
- bundle generation
- Studio import
- suite validate
- suite execute
- gate artifacts
- reporter artifacts

---

# Standard Validation by Change Type

## Docs only

```bash
pnpm typecheck
pnpm test
pnpm website:typecheck
pnpm website:build
git diff --check
```

## Core runtime or CLI

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

## Fixtures and recipes

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
pnpm recipes:check
```

## Performance or index

```bash
pnpm perf:baseline
pnpm --filter @agent-inspect/index-sqlite test
```

## Studio or viewer

```bash
pnpm --filter @agent-inspect/viewer test
pnpm --filter @agent-inspect/studio test
pnpm website:typecheck
pnpm website:build
```

## Release readiness

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm size
pnpm perf:baseline
pnpm pack:smoke
pnpm compat:smoke
pnpm website:typecheck
pnpm website:build
npm pack --dry-run
git diff --check
```

---

# Cursor Execution Model

## Phase 0 — Audit before editing

Every prompt starts by reporting:

- current version
- branch and HEAD
- working-tree state
- release-train state
- existing behavior
- relevant tests
- related docs
- exact files planned
- compatibility risks
- security risks

## Phase 1 — One bounded chunk

Rules:

- one commit-sized change
- no unrelated cleanup
- no next-train work
- no hidden network behavior
- no version bump
- no publish
- no tag
- no schema change unless explicitly authorized

## Phase 2 — Tests

Require the relevant subset:

- unit
- integration
- adversarial/security
- clean consumer
- packed artifact
- E2E
- performance
- cross-platform

## Phase 3 — Documentation

Update only when behavior changes:

- README for primary workflow
- CLI docs for command changes
- API docs for public APIs
- security/safe-sharing docs for safety changes
- migration for compatibility change
- limitations for unsupported behavior

## Phase 4 — Validation

Run commands appropriate to the change type.

## Phase 5 — Final report

Every report includes:

```text
audit summary
files created
files modified
behavior changed
public API impact
schema impact
security impact
tests added
commands run
results
deviations
remaining risks
compatibility confirmation
no-publish confirmation
recommended next chunk
```

## Release policy

- implementation chunks do not bump versions
- release readiness is separate
- changeset/version PR is separate
- publication is a manual maintainer gate
- post-publish verification is mandatory

---

# Contributor Alignment

## Good contributor areas

- fixtures
- recipes
- docs
- compatibility fixtures
- Studio UI polish after contracts are fixed
- accessibility
- standards examples
- adapter SDK examples
- renderer examples
- cross-platform consumer tests
- screenshot/demo updates

## Maintainer-owned areas

- trace schema
- root exports
- redaction internals
- MCP safety boundary
- bundle path containment
- Studio auth/ingestion security
- official adapter contracts
- release machinery
- network behavior

## Issue sizing

Every contributor issue should include:

- problem
- why it matters
- in scope
- out of scope
- acceptance criteria
- suggested files
- validation commands
- difficulty
- labels
- maintainer-review boundary

---

# Documentation Plan Before Launch

## README

Keep it short and executable:

1. one-sentence positioning
2. one tested quickstart
3. one real output image/GIF
4. three workflows:
   - debug one run
   - prevent one regression
   - create one safe artifact
5. choose-your-framework path
6. support levels
7. safety boundaries
8. links to full docs

## Website

Show:

- broken run
- failed contract
- fixed run
- safe bundle
- Studio Beta
- exact support labels
- current release
- one real design-partner quote only when approved

## Docs site

Task-based structure:

```text
Start
Capture
Inspect
Prevent regressions
Share safely
Workspace and Studio
Standards
Extend
Reference
```

## Examples

Organize by problem and framework, not old version numbers.

Required golden example sets:

- broken support agent
- RAG regression
- MCP tool failure
- CI contract
- safe incident bundle
- Studio import
- standards round trip

---

# Final Strategic Position

AgentInspect’s pre-v7 job is not to become larger.

It is to become trustworthy and repeatable.

The final pre-v7 product promise should be demonstrably true:

> **Install AgentInspect, capture or import one real agent failure, understand the causal path, turn the expected behavior into a typed trace contract, fail that contract in CI, and share a verified-safe evidence bundle—in minutes, from any supported TypeScript agent stack.**

The implementation sequence is therefore fixed:

```text
1. v6.4.1 trust/security patch
2. packed publication verification
3. v6.5.0 typed contracts and semantic correctness
4. v6.5.1 consumer/platform evidence
5. v6.6.0 Studio/index/suite productization
6. v6.6.1 self-hosting security
7. v6.7.0 standards and MCP proof
8. v6.7.1 public claim alignment
9. v6.8.0 golden-path launch candidate
10. v6.8.x adoption freeze
11. v7 decision only after mandatory gates pass
```

v7 remains conditional. The path to v7 is not implementation velocity. It is retained use, external integrations, trusted team workflows, and evidence that developers need the next layer.
