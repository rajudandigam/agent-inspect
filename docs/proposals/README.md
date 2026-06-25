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

## Rules

- Proposal docs do not implement runtime behavior.
- Accepted proposals must preserve local-first/no-upload defaults unless a later maintainer-approved RFC explicitly changes scope.
- Provider pricing, billing reconciliation, and hidden telemetry are out of scope.
- Runtime chunks must add tests and validation in the release-train plan that implements the proposal.
