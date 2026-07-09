# Architecture RFC index

This directory contains maintainer-owned architecture proposals for AgentInspect.

## Accepted / shipped

| Proposal | Status |
| --- | --- |
| [UNIFIED-PERSISTED-INSPECT-EVENT.md](./UNIFIED-PERSISTED-INSPECT-EVENT.md) | Shipped foundation in v1.2.0; dual-read corrective work completed on `main` after v1.5.0 |
| [TRACE-VOCABULARY-V1.5.md](./TRACE-VOCABULARY-V1.5.md) | Accepted for v1.5.0; corrected on `main` for `total`/`cached` token vocabulary |

## Active planning

| Proposal | Target | Purpose |
| --- | --- | --- |
| [INSPECTOR-RUNTIME.md](./INSPECTOR-RUNTIME.md) | v1.6.0 | Experimental instance runtime and `createInspector` shape |
| [TRACE-WRITER.md](./TRACE-WRITER.md) | v1.6.0 | Writer contract and memory/null/file/buffered/composite writer behavior |
| [TRACE-READER.md](./TRACE-READER.md) | v1.6.0 | Reader contract, format detection, and universal local ingestion |
| [STABLE-SCHEMA-1.0.md](./STABLE-SCHEMA-1.0.md) | v1.9/v2.0 | Stable schema target and migration constraints |
| [AI-SDK-INTEGRATION.md](./AI-SDK-INTEGRATION.md) | v1.7.0 | Implementation-ready replacement for the earlier issue-only AI SDK plan |
| [OPENAI-AGENTS-JS-TRACING.md](./OPENAI-AGENTS-JS-TRACING.md) | v1.7.0 | Safe local-only OpenAI Agents JS tracing processor boundary |
| [LANGGRAPH-ADAPTER-BOUNDARY.md](./LANGGRAPH-ADAPTER-BOUNDARY.md) | v1.7.0 | Decision to route LangGraph support through the LangChain adapter first |
| [TRACE-CHECKS.md](./TRACE-CHECKS.md) | v1.8.0 | Deterministic local trace check contract, rule/evidence model, CLI semantics, and baseline boundary |
| [REDACT-PACKAGE.md](./REDACT-PACKAGE.md) | v2.1.0 | Standalone deterministic redaction package boundary, detector/profile semantics, findings, and CLI shape |
| [EVAL-PACKAGE.md](./EVAL-PACKAGE.md) | v2.1.0 | Deterministic local eval package boundary, result schema, CLI shape, and artifact interaction |
| [CI-REPORTERS.md](./CI-REPORTERS.md) | v2.2.0 | Optional Vitest/Jest reporter package boundary, shared artifact contract, and CI summary workflow |
| [SESSIONS-AND-WORKFLOW-CAUSALITY.md](./SESSIONS-AND-WORKFLOW-CAUSALITY.md) | v2.4.0 | Additive session/workflow metadata, handoff/retry rules, MCP telemetry boundary |
| [LOCAL-TRACE-WORKSPACE.md](./LOCAL-TRACE-WORKSPACE.md) | v4.0.0 | Project-local workspace layout + `workspace.json` manifest (schema 1.0), adoption/compat, non-goals |
| [OPTIONAL-LOCAL-INDEX.md](./OPTIONAL-LOCAL-INDEX.md) | v4.1.0 | Opt-in, disposable SQLite index (`@agent-inspect/index-sqlite`) for faster local queries; driver decision, schema, staleness/recovery, publication gate |
| [SESSIONS-AND-ACTIVITY-V4.2.md](./SESSIONS-AND-ACTIVITY-V4.2.md) | v4.2.0 | Session status, activity summaries, expanded CLI, optional index acceleration (builds on v2.4 sessions RFC) |
| [SELF-HOSTED-STUDIO-V6.0.md](./SELF-HOSTED-STUDIO-V6.0.md) | v6.0.0 | Customer-owned self-hosted Studio (`@agent-inspect/studio`); read-only multi-project analyzer; SQLite default; optional Postgres; localhost + optional auth; no maintainer cloud |
| [CLIENT-HOSTED-INGESTION-V6.1.md](./CLIENT-HOSTED-INGESTION-V6.1.md) | v6.1.0 | Self-hosted Studio ingestion (file-drop, GitHub artifacts, optional HTTP + token, bundle upload); disabled by default; studio package only; no maintainer cloud |

## Rules

- Proposal docs do not implement runtime behavior.
- Accepted proposals must preserve local-first/no-upload defaults unless a later maintainer-approved RFC explicitly changes scope.
- Provider pricing, billing reconciliation, and hidden telemetry are out of scope.
- Runtime chunks must add tests and validation in the release-train plan that implements the proposal.
