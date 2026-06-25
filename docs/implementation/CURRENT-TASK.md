# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-openai-agents-tracing-rfc"
status: "ready"
dependsOn: "v1.7-ai-sdk-recipes-docs"
```

## Goal

Specify the safe local-only OpenAI Agents JS tracing processor boundary before any adapter code lands.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.7-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- official OpenAI Agents JS tracing processor docs only
- directly related adapter/RFC docs only

## In scope

1. Verify current OpenAI Agents JS tracing processor APIs and defaults from official docs.
2. Document default backend export behavior and how AgentInspect avoids surprise upload.
3. Decide whether local capture uses explicit processor installation, `setTraceProcessors()`, or defers implementation.
4. Define sensitive data controls, local-only fixture expectations, and package boundary/dependency policy.
5. Prepare chunk 7 task based on the safe/unsafe implementation decision.

## Out of scope

- OpenAI Agents adapter runtime code
- package scaffold unless chunk 6 proves chunk 7 is safe
- package version changes
- changesets
- publishing
- root/core dependencies on AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, or LangChain
- network upload behavior or default backend export behavior

## Acceptance criteria

- RFC/docs state exactly how AgentInspect avoids default backend export surprises.
- Sensitive data controls are explicit and metadata-only by default.
- Chunk 7 is either enabled for a safe optional scaffold or explicitly deferred.
- Focused docs validation and the required chunk gate pass.

## Stop condition

Stop if safe local-only behavior requires replacing user tracing configuration in a surprising way, adding root/core dependencies, or enabling upload/network behavior by default.
