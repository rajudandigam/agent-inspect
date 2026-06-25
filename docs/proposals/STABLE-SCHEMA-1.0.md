# Stable schema 1.0 proposal

**Status:** planning target for v1.9/v2.0.
**Scope:** stable schema direction, not immediate implementation.
**Non-goals:** no v1.x breaking write-format switch; no automatic rewrite of existing traces.

## Problem

AgentInspect currently supports:

- v0.1 manual JSONL traces;
- v0.2 persisted inspect events;
- in-memory normalized log/adapter events.

This bridge is acceptable during v1.x, but v2 needs a stable write/read contract that adapters, readers, checks, and exporters can share.

## Direction

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

## Deferred decisions

- exact schema version string;
- whether writer output is JSONL only or also supports bundle manifests;
- final source namespace for imported standards fields;
- stable extension namespace rules;
- deprecation timing for advanced root exports.
