# AgentInspect Roadmap — v2.1 to v3 Full Execution View

## Source of truth

This document operationalizes the active post-v2 roadmap.

Canonical product direction:

> AgentInspect is the local-first toolkit for TypeScript AI agents: trace what happened, check what should have happened, and redact what should never leave your machine.

Primary promise:

> Open a TypeScript agent trace locally. Understand it, diff it, check it, and share it safely — without an account or collector.

AgentInspect remains:
- local-first;
- CLI-first;
- TypeScript-first;
- deterministic by default;
- safe by default;
- dependency-light at root;
- framework-aware, not framework-locked;
- compatible with standards through mappings, not by making a vendor SDK required.

AgentInspect is not:
- hosted SaaS;
- a production APM replacement;
- a prompt registry;
- a dataset/eval platform;
- an LLM-as-judge platform;
- a provider pricing engine;
- a default network uploader;
- a raw chain-of-thought recorder;
- a default replay/cassette engine;
- a universal monkey-patching framework.

## v2.0 baseline

v2.0 established the contract release:

- small root API;
- schema 1.0 persisted writer path;
- v0.1, v0.2, and v1.0 reader compatibility;
- non-destructive migration workflow;
- stable reader/writer/check/exporter/reporting contract direction;
- advanced APIs behind subpaths;
- local-first product language.

Before starting v2.1, Codex must verify:
- root and public optional package versions are 2.0.0 on npm;
- README, ROADMAP, CHANGELOG, package manifests, and release state are aligned;
- `agent-inspect@2.0.0` tag points at current `main` or the expected release commit.

## Release sequence

| Release | Theme | Primary outcome | Publish target |
|---|---|---|---|
| v2.1.0 | Eval + redact utility triangle | `@agent-inspect/eval`, `@agent-inspect/redact`, shared redaction engine, deterministic local evals | Minor |
| v2.2.0 | Test reporters + CI workflows | Public Vitest/Jest reporters, CI summaries, trace/eval artifacts | Minor |
| v2.3.0 | Framework adapter hardening | AI SDK/OpenAI Agents/LangGraph polish, Mastra/Nest only if demanded | Minor |
| v2.4.0 | Sessions, multi-agent, MCP telemetry | Session navigation, handoffs, retries, MCP tool tracing | Minor |
| v2.5.0 | Guardrails + circuit breakers | Local deterministic safety utilities built on checks/redaction | Minor |
| v2.6.0 | Optional viewer and IDE/MCP surfaces | Local read-only viewer, read-only MCP server, optional editor surfaces if demanded | Minor |
| v3.0.0 | Extensible trace toolchain | Stable extension ecosystem, only if adoption gates prove demand | Conditional major |

## Why v2.1 comes first

v2.1 turns the stable v2 trace contract into a product loop:

```text
trace + eval + redact
```

It lets AgentInspect become useful even when a project has not fully adopted tracing:
- `@agent-inspect/redact` can be used on arbitrary JSON/data;
- `@agent-inspect/eval` can be used on existing traces and CI artifacts;
- shared redaction improves all trace exports, reports, verify-safe, explain, and artifact generation.

## Why reporters wait until v2.2

Reporter packages should consume v2.1 eval/redact primitives. They should not invent parallel artifact formats or safety logic.

## Why adapters wait until v2.3

AI SDK, OpenAI Agents, and LangGraph already exist. The next step is not “more adapters,” but making the official adapters first-class, stable, and fixture-backed. Mastra/NestJS remain demand-gated.

## Why sessions/MCP wait until v2.4

Session and MCP work needs schema 1.0, adapter conformance, and basic eval/check primitives to be stable. It should add workflow causality, not a gateway product.

## Why guardrails wait until v2.5

Guardrails/circuits should reuse redaction, checks, eval, sessions, and trace events. They should remain deterministic local utilities, not a policy platform.

## Why viewer/IDE waits until v2.6

Viewer/IDE surfaces are only worth adding once the core daily loop is proven:
- traces exist;
- evals/checks produce useful artifacts;
- sessions have meaningful navigation;
- users request richer surfaces.

## v3 is conditional

v3 is not guaranteed because v2 is complete. Proceed only when:
- v2 demonstrates retained usage;
- external projects emit AgentInspect-compatible traces;
- reporter/check workflows recur;
- at least one third-party adapter exists;
- users ask for extension points rather than basic setup;
- the local-first model remains a meaningful advantage.

If those signals do not appear, narrow to the best-adopted adapter/workflow rather than building a generic platform.

## Cross-train hard constraints

Do not:
- add hidden network behavior;
- add framework dependencies to root/core;
- add provider SDKs to root/core;
- capture full prompt/output/tool args by default;
- capture raw chain-of-thought;
- add provider pricing or billing estimates;
- add hosted dashboard/SaaS behavior;
- mutate traces by default;
- overwrite migrated traces by default;
- build replay/cassette as default behavior;
- publish or version without explicit release authorization.

Always:
- keep old traces readable;
- keep JSONL portable;
- preserve local-first guarantees;
- ensure package ESM/CJS/declaration compatibility;
- update docs, examples, recipes, release state, and readiness per train;
- run the correct validation gate.

## Standard train lifecycle

1. Post-release reconciliation from previous train.
2. Train plan update.
3. Chunk-by-chunk implementation.
4. Focused validation per chunk.
5. Runtime/package validation for implementation chunks.
6. Docs and recipes alignment.
7. Release-readiness document.
8. Maintainer release-prep authorization.
9. Changeset/versioning.
10. Publish workflow.
11. Post-publish verification.
12. State reset for next train.
