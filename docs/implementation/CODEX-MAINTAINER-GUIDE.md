# Codex Maintainer Guide

## Purpose

This guide defines the efficient operating workflow for using Codex to implement AgentInspect release trains. Durable product direction lives in the roadmap. Repository behavior rules live in `AGENTS.md`. Progress lives in `RELEASE-TRAIN-STATE.md`. The active commit-sized assignment lives in `CURRENT-TASK.md`.

## Required files

| File | Purpose | Update frequency |
| --- | --- | --- |
| `AGENTS.md` | Durable AI behavior and repository constraints | Rare |
| `ROADMAP.md` | Public direction | Release/strategy changes |
| `docs/implementation/ROADMAP-V1.8-TO-V3.md` | Active maintainer roadmap | Strategy changes |
| `docs/implementation/RELEASE-TRAIN-STATE.md` | Current train/chunk/commit/gate | Every chunk |
| `docs/implementation/CURRENT-TASK.md` | Exact current assignment | Every chunk |
| `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` | Active train chunks and acceptance criteria | When plan changes |
| `docs/proposals/*.md` | Architecture contracts | Architecture changes |

Do not paste the complete canonical roadmap into every Codex prompt.

## Usage-efficient operating model

Codex usage grows with repository size, task complexity, session duration, and retained context. Optimize around narrow, restartable tasks.

Recommended model:

1. Keep one long-lived release-train branch or permanent worktree.
2. Use a fresh Codex thread for each commit-sized chunk.
3. In each new thread, point Codex to:
   - `AGENTS.md`
   - `RELEASE-TRAIN-STATE.md`
   - `CURRENT-TASK.md`
   - one release-plan section
   - one relevant RFC
4. Let Codex inspect only the relevant source and tests.
5. Run targeted tests during implementation.
6. Run the chunk gate once before human review.
7. Manually commit and push.
8. Update the state/task files, then start a fresh thread.

Do not keep one thread alive from planning through release. Repeated context compaction and broad re-audits consume more allowance and increase drift.

## Worktree strategy

Preferred:

- one permanent worktree/branch for the active release train;
- one active implementation thread at a time;
- optional separate review-only thread after implementation;
- no simultaneous threads editing the same files.

Suggested branch pattern:

```text
codex/v1.8-deterministic-checks
```

The maintainer may continue on `main`, but a release-train branch is safer for manual review and rollback.

## Local environment

Set the Codex local-environment setup script to:

```bash
corepack enable
pnpm install --frozen-lockfile
```

Do not build during setup unless a clean worktree needs generated output immediately.

Recommended Codex actions:

### Fast check

```bash
pnpm typecheck && pnpm test
```

### Focused core test

Run the exact test file identified in `CURRENT-TASK.md`, for example:

```bash
pnpm exec vitest run packages/core/test/writers/index.test.ts
```

### Runtime chunk gate

```bash
pnpm build &&
pnpm typecheck &&
pnpm test &&
pnpm test:coverage &&
pnpm size &&
pnpm fixtures:check &&
pnpm pack:smoke &&
git diff --check
```

### Package/export gate

```bash
pnpm compat:smoke &&
npm pack --dry-run
```

### Full release gate

Use the command sequence in `AGENTS.md` and the release-readiness document.

## Model/effort allocation

Use a higher-usage routine model, when available, for:

- focused implementation from an approved plan
- tests and fixtures
- documentation updates
- mechanical export wiring
- resolving straightforward type errors

Use the strongest reasoning model only for:

- public API decisions
- reader ambiguity policy
- schema and compatibility decisions
- security review
- final release review
- difficult concurrency or lifecycle bugs

Do not spend a high-reasoning turn asking Codex to rerun known commands or summarize unchanged files.

## Chunk lifecycle

### 1. Prepare

The maintainer or prior Codex task updates `CURRENT-TASK.md` with:

- one goal
- exact in-scope files/areas
- out-of-scope items
- acceptance criteria
- focused tests
- chunk validation
- proposed commit message

### 2. Implement

Start a fresh thread with the “execute current task” prompt.

Codex audits Git state, reads the five small context files, implements one chunk, validates, updates state, and stops.

### 3. Review

Use the Codex review pane or a separate review-only thread. Review:

- correctness
- public API drift
- backward compatibility
- security/safety
- test quality
- documentation accuracy
- accidental dependency/package changes

### 4. Human gate

The maintainer:

- reviews the diff
- commits
- pushes
- supplies the commit hash

Codex must not do these operations unless explicitly authorized.

### 5. Resume

Update state/task documents and start a fresh thread for the next chunk. Avoid a long “continue” conversation that retains all prior implementation details.

## Autonomous release-train mode

Use autonomous mode only for an approved execution plan with explicit stop conditions.

For each chunk Codex must:

1. verify clean Git state and reconcile state/task documents;
2. implement one commit-sized scope;
3. run focused tests and the defined chunk gate;
4. review the diff and run `git diff --check`;
5. update state and current-task documents;
6. commit and push to `main` without force;
7. verify required CI;
8. continue to the next planned chunk.

Autonomous mode must stop for public breaking changes, schema changes, root/core dependencies, network behavior, unrelated changes, unresolved validation failures, credentials, partial releases, or first publication of a new npm package.

For `@agent-inspect/openai-agents`, the maintainer performs the first public npm publication after full release validation. Codex resumes only after `npm view @agent-inspect/openai-agents@1.8.0 version` succeeds.

## Decision gates

Stop for maintainer input when a chunk would:

- add or remove a public root export
- add a root/core dependency
- change a schema or persisted field contract
- alter global v0.1 writing
- introduce network behavior
- change the Node support policy
- remove compatibility behavior
- substantially change performance/memory characteristics
- broaden beyond the current release plan

## Review-only mode

A review task must not modify files until findings are reported and approved. It should prioritize:

1. correctness bugs
2. security/data-safety defects
3. breaking changes
4. API inconsistencies
5. test gaps
6. maintainability
7. documentation drift

Review findings should cite exact files/functions and include a minimal proposed correction.

## Release readiness

Do not combine implementation and release preparation.

After all chunks:

1. Run full validation.
2. Create/update the active train release-readiness document.
3. Draft release notes.
4. Inspect tarballs and exports.
5. Stop for authorization.
6. Only after authorization prepare changesets and versions.
7. Maintainer commits, pushes, tags, publishes, and creates the release.
8. Perform clean-install post-release verification.

## State file minimum fields

`RELEASE-TRAIN-STATE.md` should record:

```yaml
baselineVersion: "1.5.0"
publishedVersion: "1.5.0"
currentTrain: "v1.6.0"
trainStatus: "in_progress"
branch: "<actual branch>"
lastConfirmedCommit: "<sha>"
lastValidationLevel: "<focused|runtime|package|release>"
completedChunks: []
currentChunk: "<slug>"
pendingManualGate: "<gate>"
nextAction: "<single action>"
updatedAt: "YYYY-MM-DD"
```

Git and manifests remain authoritative.

## Failure protocol

When a test fails:

1. record the exact command;
2. determine whether the failure is caused by the current chunk;
3. run the smallest failing test;
4. fix only current-scope behavior;
5. rerun focused validation;
6. run the chunk gate once;
7. document unrelated failures without hiding them.

Do not weaken assertions, update snapshots blindly, reduce coverage thresholds, or bypass compatibility checks.
