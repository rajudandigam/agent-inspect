# Current Codex Task

## Identity

```yaml
train: "v2.4.0"
chunk: "v2.4-1-session-aware-reader-and-index-helpers"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.4-0-session-model-rfc-and-compatibility-plan"
```

## Goal

Build reusable session/group aggregation helpers per [SESSIONS-AND-WORKFLOW-CAUSALITY.md](../proposals/SESSIONS-AND-WORKFLOW-CAUSALITY.md).

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/proposals/SESSIONS-AND-WORKFLOW-CAUSALITY.md`
- `docs/implementation/release-trains/V2.4.0-EXECUTION-PLAN.md` (chunk 1)
- `packages/core/src/` — correlation metadata, search, timeline patterns
- `fixtures/` layout for new `fixtures/sessions/`

## In Scope

1. `packages/core/src/sessions/` (or equivalent) with `buildSessionIndex`.
2. Session/group aggregation, attempt/retry grouping, handoff edges, critical path model.
3. Deterministic ordering; ambiguity warnings per RFC §7.
4. Fixtures under `fixtures/sessions/` and tests under `packages/core/test/sessions/`.
5. No timestamp-only invented causality.

## Out Of Scope

- CLI `sessions` / `session` commands (chunk 2);
- search/check session flags (chunk 3);
- MCP package (chunk 4);
- schema changes, new root dependencies, network behavior.

## Acceptance Criteria

- `buildSessionIndex` produces deterministic output for fixture traces.
- Explicit vs correlated edges labeled with `source` and `confidence`.
- Old traces without session fields still index as single-run or empty session scope.
- Warnings emitted for ambiguous handoff/retry cases.

## Suggested Commit

```text
feat: add session aggregation helpers
```

## Focused Tests

```bash
pnpm exec vitest run packages/core/test/sessions
```

## Chunk Gate

```bash
pnpm exec vitest run packages/core/test/sessions
pnpm build
pnpm typecheck
pnpm test
pnpm fixtures:check
git diff --check
```

## Stop Condition

Stop if implementation requires schema rewrite, timestamp-only causality, new root/core dependency, or MCP gateway/server behavior.
