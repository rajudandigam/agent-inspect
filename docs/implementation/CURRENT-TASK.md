# Current Codex Task

## Identity

```yaml
train: "v2.4.0"
chunk: "v2.4-0-session-model-rfc-and-compatibility-plan"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.3-version-packages-pr-and-publication"
```

## Goal

Define the additive session and workflow causality model for v2.4 before runtime implementation.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.4.0-EXECUTION-PLAN.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/SCHEMA.md`
- relevant existing docs/proposals for trace relationships, checks, adapters, and MCP boundaries

## Current Evidence

- v2.3.0 published on 2026-06-28 through the standard Changesets workflow.
- Merged release commit: `ed477b6be9d89b53da2edf122b693b343bb12ec4`.
- npm registry reports `latest: 2.3.0` for all nine public packages.
- Git tags and GitHub releases exist for `agent-inspect@2.3.0` and the eight public optional packages.
- Merged-commit CI and Publish workflows passed.

## In Scope

1. Create `docs/proposals/SESSIONS-AND-WORKFLOW-CAUSALITY.md`.
2. Define additive fields and relationship rules for `sessionId`, `conversationId`, `groupId`, `parentGroupId`, `attempt`, handoff, sub-agent, job/queue/workflow metadata, and MCP semantic boundaries.
3. Update `docs/SCHEMA.md` only for additive optional metadata guidance, with old trace readability preserved.
4. Update the v2.4 execution plan if chunk 0 produces clarified acceptance criteria.
5. Preserve ambiguity and confidence policy: do not infer causality from timestamps alone.

## Out Of Scope

- runtime session index helpers;
- CLI session/search/check commands;
- MCP telemetry implementation, package creation, server, or gateway behavior;
- package versions, changesets, tags, GitHub releases, or npm publication;
- new root/core dependencies;
- hosted upload, provider calls, network behavior, schema changes, or public breaking changes;
- viewer work, MCP read-only server, IDE surfaces, or v3 extensibility implementation.

## Acceptance Criteria

- Session/workflow model is additive and compatible with existing v0.1, v0.2, and v1.0 traces.
- Relationship rules preserve source/confidence, warn on ambiguity, and avoid timestamp-only invented causality.
- MCP boundary is limited to telemetry semantics, not a gateway/server product.
- Docs clearly separate chunk 0 model decisions from later implementation chunks.

## Suggested Commit

```text
docs: define session and workflow causality model
```

## Focused Tests

```bash
pnpm typecheck
```

## Chunk Gate

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Stop Condition

Stop if the model requires a schema-breaking rewrite, new persisted model, new root/core dependency, network behavior, MCP gateway/server behavior, public breaking change, or a maintainer decision about ambiguous causality.
