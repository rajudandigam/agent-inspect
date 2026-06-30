# Codex Maintainer Guide

## Purpose

Codex is the active development tool for AgentInspect. Cursor-era docs are historical references unless an active task explicitly reactivates them.

Durable repository behavior rules live in [../../AGENTS.md](../../AGENTS.md). Adoption work: [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md). Progress: [RELEASE-TRAIN-STATE.md](./RELEASE-TRAIN-STATE.md). Active assignment: [CURRENT-TASK.md](./CURRENT-TASK.md).

## Active files

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Durable AI behavior and repository constraints |
| `docs/implementation/POST-V3.5-ADOPTION-PLAN.md` | Post-v3.5 adoption outreach |
| `docs/implementation/release-trains/V3.5.X-ADOPTION-POLISH-PLAN.md` | Docs/npm polish patches |
| `docs/implementation/RELEASE-TRAIN-STATE.md` | Current train/chunk/commit/gate |
| `docs/implementation/CURRENT-TASK.md` | Exact current assignment |
| `docs/proposals/*.md` | Architecture contracts |

Historical roadmaps: [ROADMAP-V3.0-TO-V3.5.md](./ROADMAP-V3.0-TO-V3.5.md) (complete) · [archive/](../archive/README.md)

Do not paste the complete roadmap into every Codex prompt. Point Codex at the active files and the one relevant plan/RFC section.

## Operating model

One commit-sized chunk per task remains the default. Autonomous release-train mode is allowed only when `AGENTS.md`, `CURRENT-TASK.md`, and the active execution plan all authorize it.

For each chunk Codex should:

1. verify clean Git state and reconcile state/task files;
2. read only the active context and directly related docs/source/tests;
3. implement the scoped chunk;
4. run focused tests and the defined chunk gate once;
5. update state and task files;
6. stop for review, or commit/push only when autonomous mode explicitly authorizes it.

No version, publish, tag, GitHub release, or changeset operation is allowed without explicit release-prep authorization.

## Validation

Docs-only gate:

```bash
pnpm typecheck
pnpm test
git diff --check
```

Runtime validation and release validation remain unchanged from `AGENTS.md`. Use the runtime chunk gate for core/runtime work and full release readiness only at a release gate.

Do not repeatedly run `pnpm install` during ordinary chunks.

## Stop conditions

Stop for maintainer input when a chunk would:

- add or remove a public root export;
- add a root/core dependency;
- change a schema or persisted field contract;
- alter global v0.1 writing;
- introduce network behavior;
- change the Node support policy;
- remove compatibility behavior;
- broaden beyond the current release plan;
- require version, changeset, publish, tag, or GitHub release work.

## Historical docs

Historical release-readiness records, older roadmaps, Cursor files, and one-off Codex addendum/prompt files may remain for archaeology. They are not active instructions unless referenced by `CURRENT-TASK.md`.
