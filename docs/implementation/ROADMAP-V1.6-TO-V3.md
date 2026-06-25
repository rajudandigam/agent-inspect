# Roadmap — v1.6 through v3

**Status:** active maintainer roadmap after the v1.5.0 publication and internal v1.5 corrective work.
**Source input:** [CANONICAL-ROADMAP-V1.6-TO-V3.md](./CANONICAL-ROADMAP-V1.6-TO-V3.md).
**Published baseline:** `agent-inspect@1.5.0`, `@agent-inspect/langchain@1.5.0`, `@agent-inspect/tui@1.5.0`.

This document is the concise execution roadmap. The larger canonical input remains archived as source material; when documents disagree, prefer this file, package manifests, tests, and release-train state.

## Release policy

- Continue committing small validated chunks to `main`.
- Do not publish patch releases for routine corrective work; accumulate completed work into the next minor train unless the maintainer explicitly authorizes an emergency patch.
- Do not create changesets, version bumps, tags, or publishes until manual release confirmation.
- Keep `schemaVersion: "0.1"` traces readable through v1.x.
- Keep local-first/no-upload defaults.

## Current baseline

v1.5.0 shipped:

- manual tracing APIs and local v0.1 JSONL traces;
- v0.2 persisted-event foundation and dual-format inspection reads;
- `what` and `report`;
- `timeline`, `stats`, `search`, `diff`, `export`;
- redaction profiles and complete-report corrective safety on `main`;
- token usage vocabulary corrections on `main`;
- optional LangChain and TUI packages.

Internal v1.5 corrective commits after publication are complete on `main` and are not a standalone publish target unless the maintainer changes release policy.

## v1.6.0 — Runtime foundation and universal trace ingestion

Goal: make AgentInspect able to instrument local code through an instance API and open traces produced elsewhere.

Primary scope:

- experimental `createInspector` instance runtime;
- `TraceWriter` contract and memory/null/file/buffered/composite writers;
- `TraceReader` contract and deterministic format detection;
- AgentInspect v0.1/v0.2 readers behind the new reader interface;
- OpenInference and OTLP JSON local readers;
- universal `agent-inspect open` command;
- current inspection commands progressively consume the shared reader pipeline;
- recipes for open/read/write workflows.

Out of scope:

- default network upload;
- provider pricing or token counting;
- hosted dashboard;
- framework adapter packages;
- v2 stable schema switch.

## v1.7.0 — Framework-native adoption

Goal: make AgentInspect easy to adopt in TypeScript agent frameworks that already expose lifecycle information.

Primary scope:

- `@agent-inspect/ai-sdk` optional adapter;
- OpenAI Agents trace processor package;
- LangGraph support through `@agent-inspect/langchain` unless a separate package becomes necessary;
- adapter conformance preview fixtures;
- starter projects and compatibility matrices.

The previous AI-SDK-only v1.6 plan is superseded. AI SDK work starts after the v1.6 runtime/reader/writer foundation is published and verified.

## v1.8.0 — Deterministic checks and CI

Goal: turn local traces into deterministic CI evidence.

Primary scope:

- `check` and `assert` helpers;
- local cohort/baseline comparison;
- Vitest/Jest reporters;
- safe CI artifacts and failure summaries.

## v1.9.0 — Standards hardening and v2 freeze

Goal: turn compatibility into a tested contract.

Primary scope:

- OpenInference and OTLP conformance fixtures;
- adapter conformance suite;
- schema 1.0 RFC freeze;
- migration guide draft;
- v2 RC readiness.

## v2.0.0 — Stable utility contract

Goal: publish the stable trace utility contract.

Primary scope:

- small stable root API;
- schema 1.0 writer;
- v0.1/v0.2 readers retained;
- stable reader/writer/check APIs;
- documented migration path.

## v3.0 direction

v3 is conditional on adoption evidence. Possible direction:

- plugin ecosystem;
- adapter SDK;
- MCP-oriented workflows;
- richer local viewer;
- diagnostic mode.

Do not broaden into hosted SaaS or default telemetry upload in response to weak adoption.

## Architecture RFCs

Active proposal index: [docs/proposals/README.md](../proposals/README.md)

Current planning RFCs:

- [INSPECTOR-RUNTIME.md](../proposals/INSPECTOR-RUNTIME.md)
- [TRACE-WRITER.md](../proposals/TRACE-WRITER.md)
- [TRACE-READER.md](../proposals/TRACE-READER.md)
- [STABLE-SCHEMA-1.0.md](../proposals/STABLE-SCHEMA-1.0.md)
- [AI-SDK-INTEGRATION.md](../proposals/AI-SDK-INTEGRATION.md)

Product validation dashboard: [ADOPTION-METRICS.md](../product/ADOPTION-METRICS.md)

## Immediate implementation order

1. Roadmap/documentation reset.
2. Architecture RFCs for inspector, reader, writer, and schema.
3. Memory and null writers.
4. Direct file writer.
5. Buffered and composite writers.
6. Instance-scoped runtime.
7. `createInspector`.
8. Reader abstraction.
9. Consolidated v0.1/v0.2 readers.
10. OpenInference reader.
11. OTLP JSON reader.
12. Universal `open`.
13. Inspection command migration.
14. Recipes and readiness.
