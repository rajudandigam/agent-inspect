# Codex prompt — autonomous v2-to-v3 execution

Read `AGENTS.md` first.

You are continuing AgentInspect after v2.0.0.

Use these active planning files:

- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/CURRENT-TASK.md`
- the active `docs/implementation/release-trains/V*.0-EXECUTION-PLAN.md`

## Start-of-run audit

Run:

```bash
git status --short
git branch --show-current
git pull --ff-only origin main
git log -5 --oneline
git diff --check
git tag --points-at HEAD
npm view agent-inspect version
npm view @agent-inspect/ai-sdk version
npm view @agent-inspect/openai-agents version
npm view @agent-inspect/langchain version
npm view @agent-inspect/tui version
```

If the active train has public optional packages, also verify those package versions.

Proceed only if:
- branch is `main`;
- working tree is clean;
- pull is fast-forward only;
- npm/package state matches release state;
- `CURRENT-TASK.md` identifies exactly one active chunk or the prompt explicitly authorizes continuous execution.

Stop on mismatch.

## Execution mode

You may proceed autonomously through the active release train only.

For each chunk:

1. Read only relevant plan section, current task, state, architecture guide, and directly related source/tests.
2. Report scope, risks, expected files, and validation.
3. Implement exactly one chunk.
4. Add/update tests and docs.
5. Run focused validation.
6. Run chunk gate.
7. Update `RELEASE-TRAIN-STATE.md`.
8. Update `CURRENT-TASK.md` for the next chunk.
9. Commit and push only if validation passes and autonomous mode is authorized.
10. Continue to the next chunk only if the plan permits and no stop condition is hit.

## Hard stop conditions

Stop without committing/pushing if:

- unrelated worktree changes exist;
- validation fails and cannot be repaired in scope;
- a fix requires root/core dependency additions;
- a fix requires hidden network behavior;
- a fix requires schema redesign;
- a fix requires default full prompt/output capture;
- a fix requires provider SDKs in root/core;
- a first public package publication requires npm credentials/Trusted Publisher setup;
- any package/version/tag/publish operation is needed without explicit release-prep authorization;
- the work drifts into hosted dashboard, APM, replay, cost engine, prompt registry, dataset platform, or universal monkey-patching scope.

## Release train completion

At the end of each train:

1. Run full release-readiness validation.
2. Create/update train release-readiness doc.
3. Draft changelog and release notes.
4. Verify tarballs/package contents.
5. Stop and ask for explicit release-prep authorization.

Do not create changesets, bump versions, publish, tag, or create GitHub releases unless explicitly authorized.
