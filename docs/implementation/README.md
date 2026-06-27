# Implementation docs index

These files are maintainer-facing. Public product docs live under `docs/` and the repository root.

## Active files

- [ROADMAP-V1.8.1-TO-V3.md](./ROADMAP-V1.8.1-TO-V3.md) — active maintainer roadmap and product direction.
- [RELEASE-TRAIN-STATE.md](./RELEASE-TRAIN-STATE.md) — current train status, validation level, and next action.
- [CURRENT-TASK.md](./CURRENT-TASK.md) — active commit-sized Codex assignment.
- [CODEX-MAINTAINER-GUIDE.md](./CODEX-MAINTAINER-GUIDE.md) — Codex operating model for AgentInspect.
- [CODEX-LOCAL-ENVIRONMENT.md](./CODEX-LOCAL-ENVIRONMENT.md) — local setup notes for Codex worktrees.
- [CODEX-PROMPTS.md](./CODEX-PROMPTS.md) — reusable prompt snippets.
- [release-trains/V1.8.1-EXECUTION-PLAN.md](./release-trains/V1.8.1-EXECUTION-PLAN.md) — active v1.8.1 docs cleanup plan.

## Historical files

Older roadmaps, release-readiness records, Cursor-era files, and one-off prompt/addendum files are historical unless an active task explicitly reactivates them. Do not use them as current Codex instructions.

Historical records remain useful for release archaeology, compatibility decisions, and understanding why a boundary exists. Start with [archive/README.md](./archive/README.md) when looking for superseded operational files.

## Release-train files

Release plans and readiness records live under [release-trains/](./release-trains/). Humans should use these files for release history and validation evidence. Codex should read only the active plan section for the current chunk unless architecture or release direction changes.

## Prompt files

Reusable prompts live in [prompts/](./prompts/) and [CODEX-PROMPTS.md](./CODEX-PROMPTS.md). Old one-off prompts in this directory are historical references, not active execution instructions.

## Where to look first

Codex should follow the source-of-truth order in [../../AGENTS.md](../../AGENTS.md): Git state, `AGENTS.md`, state/task files, the active roadmap, the active release plan, relevant RFCs, public roadmap, then historical docs.
