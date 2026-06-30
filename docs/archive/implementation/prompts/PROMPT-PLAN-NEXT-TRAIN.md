# Codex prompt — plan the next release train

Read `AGENTS.md` first.

Plan the next AgentInspect release train. Do not implement runtime code.

Run:

```bash
git status --short
git branch --show-current
git pull --ff-only origin main
git log -5 --oneline
git diff --check
```

Read:

- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/CURRENT-TASK.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- latest release-readiness doc
- package manifests
- public README/ROADMAP/CHANGELOG

Goal:

1. Verify previous train is complete and published.
2. Reconcile state and docs.
3. Create/update the next `Vx.y.0-EXECUTION-PLAN.md`.
4. Create/update `CURRENT-TASK.md` for chunk 0.
5. Update `RELEASE-TRAIN-STATE.md`.
6. Run docs-level validation.

Do not:
- implement code;
- change package versions;
- create changesets;
- publish;
- tag;
- add dependencies.

Validation:

```bash
pnpm typecheck
pnpm test
git diff --check
```

Commit/push only if validation passes and autonomous mode is authorized.
