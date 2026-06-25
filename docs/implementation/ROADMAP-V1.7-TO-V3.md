# Roadmap — v1.7 through v3

**Status:** active maintainer roadmap after the v1.6.0 publication.
**Source input:** [ROADMAP-V1.6-TO-V3.md](./ROADMAP-V1.6-TO-V3.md), refreshed from the published v1.6.0 baseline.
**Published baseline:** `agent-inspect@1.6.0`, `@agent-inspect/langchain@1.6.0`, `@agent-inspect/tui@1.6.0`.

This document is the concise execution roadmap for work after the v1.6 runtime/reader/writer foundation. The previous v1.6 roadmap remains historical context; when documents disagree, prefer this file, package manifests, tests, and release-train state.

## Release policy

- Continue committing small validated chunks to `main`.
- Do not create changesets, version bumps, tags, publishes, or GitHub releases until the release-readiness gate and maintainer release instruction.
- Keep `schemaVersion: "0.1"` traces readable through v1.x.
- Keep v0.2 persisted events experimental and additive.
- Keep local-first/no-upload defaults.
- Keep framework integrations optional packages; do not add AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, or LangChain dependencies to root/core.

## Current baseline

v1.6.0 shipped:

- stable manual tracing and local v0.1 JSONL compatibility retained;
- v0.2 persisted-event foundation retained as experimental;
- experimental local writer contract and memory/null/file/buffered/composite writers;
- experimental instance-scoped runtime and `createInspector()` API;
- experimental local reader contract and canonical AgentInspect JSONL reader;
- local OpenInference JSON and OTLP JSON readers;
- universal `agent-inspect open`;
- shared reader integration for compatible inspection commands;
- runtime and universal-ingestion recipe coverage;
- no default network upload, hosted ingestion, replay, provider pricing, or root/core adapter dependencies.

## v1.7.0 — Framework-native adoption

Goal: make AgentInspect easy to adopt in TypeScript agent frameworks that already expose lifecycle information, using the v1.6 local runtime/read/write foundation.

Primary scope:

- verify current AI SDK v6 telemetry integration APIs and update the RFC before implementation;
- `@agent-inspect/ai-sdk` optional package;
- metadata-only integration for AI SDK `generateText` and `streamText`;
- AI SDK tool/error/streaming fixture coverage;
- AI SDK recipes, docs, and package smoke checks;
- OpenAI Agents JS tracing processor RFC before any package scaffold;
- optional OpenAI Agents adapter scaffold only if it can remain local-only and dependency-isolated;
- LangGraph support decision through `@agent-inspect/langchain` unless a separate optional package becomes necessary;
- adapter conformance fixture matrix;
- release readiness.

Out of scope:

- default telemetry upload or vendor sink behavior;
- raw prompt/output capture by default;
- AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, or LangChain dependencies in root/core;
- monkey-patching provider SDKs, global fetch, or framework internals;
- schema 1.0 or v2 migration work;
- CI reporters and deterministic assertion helpers.

Privacy defaults:

- AI SDK usage must explicitly set or document `recordInputs: false` and `recordOutputs: false`.
- Adapter capture defaults remain metadata-only.
- Preview/full capture, if ever supported, must be explicit, bounded, redacted, and covered by tests.
- OpenAI Agents work must avoid surprising default backend export behavior; local-only processor behavior must be documented before implementation.

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

- [AI-SDK-INTEGRATION.md](../proposals/AI-SDK-INTEGRATION.md)
- OpenAI Agents JS tracing processor RFC (planned in v1.7 chunk 6)
- LangGraph support decision note (planned in v1.7 chunk 8)
- [INSPECTOR-RUNTIME.md](../proposals/INSPECTOR-RUNTIME.md)
- [TRACE-WRITER.md](../proposals/TRACE-WRITER.md)
- [TRACE-READER.md](../proposals/TRACE-READER.md)
- [STABLE-SCHEMA-1.0.md](../proposals/STABLE-SCHEMA-1.0.md)

Product validation dashboard: [ADOPTION-METRICS.md](../product/ADOPTION-METRICS.md)

## Immediate implementation order

1. v1.7 planning reset and docs alignment.
2. AI SDK v6 telemetry/RFC verification.
3. `@agent-inspect/ai-sdk` package scaffold.
4. AI SDK metadata-only integration for `generateText` and `streamText`.
5. AI SDK tool/error/streaming coverage and fixtures.
6. AI SDK recipes, package smoke, and docs.
7. OpenAI Agents JS tracing processor RFC.
8. Optional OpenAI Agents adapter scaffold only if no root/core dependency or upload risk.
9. LangGraph support decision through `@agent-inspect/langchain`.
10. Adapter conformance fixture matrix.
11. v1.7 release readiness.
