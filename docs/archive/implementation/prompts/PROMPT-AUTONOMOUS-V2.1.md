# Codex prompt — v2.1 autonomous release train

Read `AGENTS.md` first.

The maintainer says v2.0.0 has been published. Before implementing v2.1, verify and reconcile the repository.

Repository:

```text
https://github.com/rajudandigam/agent-inspect
```

## Start-of-run audit

Run:

```bash
git status --short
git branch --show-current
git pull --ff-only origin main
git log -5 --oneline
git diff --check
git tag --points-at HEAD
git rev-parse HEAD
npm view agent-inspect version
npm view @agent-inspect/ai-sdk version
npm view @agent-inspect/openai-agents version
npm view @agent-inspect/langchain version
npm view @agent-inspect/tui version
```

Proceed only if:

- branch is `main`;
- working tree is clean;
- pull is fast-forward only;
- `main` matches the `agent-inspect@2.0.0` tag or the tag points at HEAD;
- all public package versions on npm are `2.0.0`;
- package manifests agree with v2.0.0.

Stop on mismatch.

## Source-of-truth order

1. Git state, package manifests, source, tests, fixtures
2. `AGENTS.md`
3. `docs/implementation/RELEASE-TRAIN-STATE.md`
4. `docs/implementation/CURRENT-TASK.md`
5. `docs/implementation/ROADMAP-V2.1-TO-V3.md`
6. active release-train plan
7. public `ROADMAP.md`
8. historical implementation docs

If `ROADMAP-V2.1-TO-V3.md` does not exist yet, create it from the existing active roadmap and current post-v2 sequence.

## Immediate task: post-v2 reconciliation

Implement only the task in `docs/implementation/CURRENT-TASK.md`, or create/update that file first if it still points to completed v2.0 release prep.

Required reconciliation:

1. Update `README.md` so it says current npm release is `2.0.0`.
2. Update `ROADMAP.md` so:
   - current release is `2.0.0`;
   - v2.0 is Released recently;
   - v2.1 utility triangle is Now;
   - v2.2+ future sequence is visible.
3. Update `docs/implementation/RELEASE-TRAIN-STATE.md` to v2.1 planning.
4. Update `docs/implementation/CURRENT-TASK.md` to v2.1 post-v2 reconciliation.
5. Update `docs/implementation/release-trains/V2.0.0-RELEASE-READINESS.md` with post-publish evidence.
6. Create/update:
   - `docs/implementation/ROADMAP-V2.1-TO-V3.md`
   - `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
7. Include missing linked docs in `package.json` `files` when needed:
   - `docs/SAFE-TRACE-SHARING.md`
   - `docs/INSTALL-SMOKE-TEST.md`
8. Align any docs that still say v2 is unreleased or that v1.9 is current.

Validation for this docs/process chunk:

```bash
pnpm typecheck
pnpm test
git diff --check
```

Run `pnpm recipes:check` if recipe docs or recipe files change.

Commit and push this reconciliation chunk only if validation passes.

Suggested commit:

```text
docs: reconcile v2 publish and start v2.1 train
```

## After reconciliation

Continue autonomously through the v2.1.0 execution plan one chunk at a time.

Chunk order:

1. Redaction package RFC and boundary
2. `@agent-inspect/redact` scaffold and core engine extraction
3. Redaction detectors, findings, and profiles
4. Integrate redaction package with trace safety and CLI
5. Eval package RFC and boundary
6. `@agent-inspect/eval` package scaffold and deterministic eval core
7. Eval grounding heuristics and CLI
8. Eval/redact recipes and documentation
9. v2.1 release readiness

For every chunk:

1. Re-audit working tree.
2. Read only the relevant plan section, RFC, source, and tests.
3. Implement exactly one chunk.
4. Run focused validation.
5. Run the chunk gate once.
6. Update state and current-task docs.
7. Commit and push to `main` only if validation passes.
8. Continue to next chunk.

## Hard stop conditions

Stop without committing/pushing when:

- unrelated worktree changes exist;
- npm/package/tag state conflicts with the plan;
- validation fails and cannot be repaired in-scope;
- a fix requires a new root/core dependency;
- a fix requires hidden network behavior;
- a fix requires an LLM judge by default;
- a fix requires a schema redesign;
- a first public package publication requires credentials or Trusted Publisher setup;
- the release requires changesets/versioning/publishing without explicit authorization.

## Release readiness

After all v2.1 chunks:

1. Create/update `docs/implementation/release-trains/V2.1.0-RELEASE-READINESS.md`.
2. Run full release gate:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm size
pnpm test:all
pnpm pack:smoke
pnpm compat:smoke
npm pack --dry-run
git diff --check
```

3. Stop and ask for release-prep authorization.

Do not publish, tag, create releases, or create changesets unless the maintainer explicitly authorizes release preparation.
