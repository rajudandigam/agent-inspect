# Historical reference only. Do not use as active Codex instructions. See docs/implementation/README.md and ROADMAP-V1.8.1-TO-V3.md.

# Roadmap - v1.8 through v3

**Status:** v1.8.0 published; use remaining v1.9/v2 sections for the next train
**Published baseline:** `agent-inspect@1.8.0`, `@agent-inspect/ai-sdk@1.8.0`, `@agent-inspect/langchain@1.8.0`, `@agent-inspect/openai-agents@1.8.0`, `@agent-inspect/tui@1.8.0`
**Canonical source:** the finalized AgentInspect implementation roadmap supplied by the maintainer

## Product direction

AgentInspect is the universal local reader, debugger, differ, and CI checker for TypeScript agent traces.

Public promise:

> Open TypeScript agent traces locally. Understand them, diff them, and assert on them without an account or collector.

Keep the product local-first, deterministic, dependency-light, metadata-oriented by default, and compatible with existing traces. Do not add hosted SaaS, default upload, provider pricing, raw chain-of-thought capture, universal monkey-patching, or automatic remediation.

## v1.7 actual outcome

v1.7.0 shipped:

- experimental public `@agent-inspect/ai-sdk` for AI SDK v6 telemetry;
- metadata-only run, step, tool, streaming, and token summaries;
- one no-network AI SDK recipe;
- OpenAI Agents tracing RFC and private scaffold;
- LangGraph package-boundary decision;
- declarative adapter conformance matrix.

Deferred from the finalized v1.7 roadmap and carried into the v1.8 train:

- AI SDK canonical-reader lifecycle correctness and parallel integration isolation;
- functional or explicitly deprecated preview/redaction adapter options;
- working OpenAI Agents tracing processor and recipes;
- LangGraph graph/subgraph/task/branch/checkpoint fixtures and mapping;
- executable shared adapter conformance fixtures;
- optional-package packed clean-install smoke.

Do not rewrite history by claiming these deferred items shipped in v1.7.

## v1.8.0 - Deterministic checks, safe sharing, and CI

Published 2026-06-27. See [V1.8.0-RELEASE-READINESS.md](./release-trains/V1.8.0-RELEASE-READINESS.md) for validation and publication evidence.

Goal: turn local traces into enforceable, explainable engineering artifacts.

### Foundation gate

Before check APIs:

- one logical adapter span retains one logical identity;
- adapter traces round-trip through readers, trees, reports, diffs, and checks;
- parallel adapter runs do not share mutable state;
- OpenAI Agents and LangGraph catch-up work has deterministic no-network fixtures;
- public optional packages pass packed clean-install smoke.

### Checks

- experimental `agent-inspect/checks` subpath;
- pure deterministic rule engine;
- `TraceCheckResult` and evidence-bearing rule results;
- run, tool, LLM, structure, baseline, and safety rules;
- no LLM calls and no network behavior;
- every failure includes stable event/span evidence, expected value, actual value, and a message.

### CLI

- `agent-inspect check`;
- JSON output;
- explicit input format override;
- stable exit codes: 0 pass, 1 rule failure, 2 invalid arguments/config, 3 unreadable trace, 4 unsupported format;
- JSON and JavaScript config support;
- TypeScript config support only through a Node >=20-compatible, dependency-conscious design documented by the checks RFC.

### Baseline regression

Compare normalized structural dimensions: tree shape, first divergence, tools, LLM calls, models/providers, tokens, duration, retries, status, errors, retrievals, and guardrails. Do not fail on nondeterministic text differences by default.

### Safety

- `scan` for likely secrets and unsafe capture paths;
- `verify-safe` producing SAFE, SAFE WITH WARNINGS, UNSAFE, or UNKNOWN;
- redaction before artifact rendering;
- best-effort claims only, never compliance certification.

### Test integrations

- independent `@agent-inspect/vitest` and `@agent-inspect/jest` packages;
- explicit test-to-trace association;
- failure artifacts without timestamp guessing;
- reporter errors never replace original test failures;
- successful tests avoid expensive reports by default.

### CI outputs

- JSONL trace;
- Markdown and HTML reports;
- `check-results.json`;
- structural diff;
- GitHub step summary;
- standard artifact upload controlled by user CI;
- no GitHub App, OAuth, automatic PR comment, or repository-write requirement.

## v1.8 release gate

- checks pass across v0.1, v0.2, OpenInference, OTLP JSON, AI SDK, OpenAI Agents, and LangChain/LangGraph fixtures;
- results and evidence are deterministic;
- built CLI exit codes are tested;
- no LLM or network dependency;
- reporters preserve original failures;
- safety applies before artifact generation;
- secret scanning is documented as best-effort;
- package boundaries and ESM/CJS/types smoke pass;
- performance limits are measured and documented;
- adoption evidence is recorded honestly and never fabricated.

## v1.9.0 - Sessions, conformance, and v2 freeze

Primary scope:

- session and cross-run navigation;
- schema, structural, semantic, safety, and compatibility conformance;
- canonical fixture suite;
- adapter author kit;
- standards mapping hardening;
- performance/failure characterization;
- schema 1.0 and v2 API freeze.

## v2.0.0 - Stable local trace utility

Primary scope:

- small stable root API;
- schema 1.0 default writes;
- v0.1/v0.2 reads retained;
- stable readers, writers, checks, adapters, reporters, and exporters;
- non-destructive migration;
- release candidates and external migration validation.

## v2.x and v3

Expand only after adoption evidence. Possible later work includes Mastra, MCP, controlled diagnostic mode, a local viewer, read-only MCP tools, adapter SDK, and community registry.

v3 remains conditional on retained usage and external adapters. Do not respond to weak adoption by building a hosted dashboard.
