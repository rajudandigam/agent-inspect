# Stable schema 1.0 proposal

**Status:** frozen for v2.0 implementation.
**Scope:** stable schema direction and implementation constraints.
**Non-goals:** no v1.x breaking write-format switch; no automatic rewrite of existing traces.

## Problem

AgentInspect currently supports:

- v0.1 manual JSONL traces;
- v0.2 persisted inspect events;
- in-memory normalized log/adapter events.

This bridge is acceptable during v1.x, but v2 needs a stable write/read contract that adapters, readers, checks, and exporters can share.

## Frozen direction

Schema 1.0 should be an evolution of `PersistedInspectEvent`, not a third unrelated model.

Required themes:

- one logical event row per inspectable node where possible;
- explicit source provenance;
- explicit parent relationships;
- stable kind/status vocabulary;
- optional token usage counts only;
- trace/span identifiers where supplied;
- import warnings and unsupported-field preservation;
- bounded input/output summaries only when explicitly captured;
- local-first safety metadata.

Frozen decisions for v2.0:

- The stable persisted schema version string is `schemaVersion: "1.0"`.
- The v2 default writer format remains newline-delimited JSON; bundle manifests are deferred.
- A schema 1.0 row represents one inspectable event/node using the existing `PersistedInspectEvent` shape as the baseline.
- Required row fields are `schemaVersion`, `eventId`, `runId`, `kind`, `name`, `timestamp`, `confidence`, and `source`.
- Optional row fields remain `parentId`, `status`, `startedAt`, `endedAt`, `durationMs`, `attributes`, `inputSummary`, `outputSummary`, `error`, `tokenUsage`, and `trace`.
- `source.type` remains a coarse local provenance class; framework/package specifics belong in `source.name` and `source.version`.
- Unknown optional fields on schema 1.0 rows are preserved by readers/migration where safe and reported through warnings or `unsupportedFields` when they cannot be represented.
- Raw prompts, outputs, request bodies, response bodies, and chain-of-thought are not captured by default.
- Core schema 1.0 has no provider pricing or billing field.

## Compatibility constraints

- v0.1 traces remain readable.
- v0.2 traces remain readable.
- Existing v1.x root APIs are not removed without a v2 migration guide.
- Unknown optional fields are ignored where safe.
- No raw chain-of-thought capture by default.
- No provider pricing or billing field in core schema.

## Migration requirements before v2 stable

- schema 1.0 RFC freeze;
- conformance fixtures;
- v0.1 and v0.2 read compatibility tests;
- migration guide draft;
- release candidate validation;
- external migration feedback.

## Deferred decisions after v2.0

- stable extension namespace rules;
- typed bundle manifests;
- richer standards export/import field namespaces beyond current OpenInference/OTLP preservation;
- deprecation timing for advanced root exports after v2 migration adoption.
