# Codex prompt — resume active release train

Read `AGENTS.md` first.

Resume the active AgentInspect release train.

Run:

```bash
git status --short
git branch --show-current
git pull --ff-only origin main
git log -5 --oneline
git diff --check
```

Then read:

- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/CURRENT-TASK.md`
- the active release-train plan
- the relevant RFC/proposal
- directly related source and tests

Reconcile Git state with the release state. Stop on mismatch.

Execute exactly the next incomplete chunk. Do not implement more than one chunk unless the active prompt explicitly authorizes autonomous continuation and all validations pass.

For this chunk:

1. Report scope and risks.
2. Implement the chunk.
3. Add/update tests.
4. Update docs.
5. Run focused validation.
6. Run chunk gate.
7. Update state and current-task docs.
8. Commit and push only if validation passes and autonomous mode is authorized.

Stop on validation failure, scope expansion, dependency changes, schema redesign, hidden network behavior, or any release operation requiring authorization.

Final report must include changed files, validation results, commit SHA if committed, next chunk, and any blockers.
