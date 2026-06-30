# Codex Prompt Library

## 1. Execute the current chunk

```text
Read AGENTS.md first.

Execute exactly the task in docs/implementation/CURRENT-TASK.md.

Before editing, run:
git status --short
git branch --show-current
git log -3 --oneline
git diff --check

Reconcile Git state with docs/implementation/RELEASE-TRAIN-STATE.md. Stop on unrelated changes or material drift.

Read only the files listed in CURRENT-TASK.md plus directly relevant implementations/tests. Do not reread the full canonical roadmap or perform a broad repository audit.

Report the exact scope, files, focused tests, risks, and out-of-scope items. Then implement this one chunk.

Run the focused validation from CURRENT-TASK.md during iteration. When stable, run the chunk gate once. Fix current-scope failures only.

Update RELEASE-TRAIN-STATE.md and CURRENT-TASK.md for the next chunk, but do not implement the next chunk.

Stop with the final report required by AGENTS.md.

Do not commit, push, change versions, create a changeset, tag, publish, or create a release.
```

## 2. Resume after maintainer commit

```text
Read AGENTS.md first.

The maintainer reviewed, committed, and pushed the previous chunk.

Run:
git status --short
git branch --show-current
git log -3 --oneline
git diff --check

Verify the working tree is clean and reconcile the latest commit with RELEASE-TRAIN-STATE.md. Stop on mismatch.

Then execute exactly docs/implementation/CURRENT-TASK.md using the one-chunk protocol. Read only the current task, active plan section, relevant RFC, and related source/tests.

Do not repeat prior audits or implement later chunks.

Validate, update state/task documents, report, and stop. Do not commit, push, version, tag, publish, or create a changeset.
```

## 3. Review-only

```text
Read AGENTS.md first.

Review the current uncommitted diff only. Do not edit files.

Run:
git status --short
git diff --stat
git diff --check
git diff

Review in this order:
1. correctness
2. security and data safety
3. breaking changes
4. schema and trace fidelity
5. async/concurrency/lifecycle behavior
6. ESM/CJS and public exports
7. tests and edge cases
8. performance/size
9. documentation accuracy

Compare only against CURRENT-TASK.md, the relevant active-plan section, and relevant RFC.

Report findings by severity with exact file/function evidence and a minimal correction. State whether the chunk is ready for maintainer commit.

Do not modify, commit, push, version, tag, or publish.
```

## 4. Release readiness

```text
Read AGENTS.md first.

Audit v1.6.0 release readiness. Do not change versions or create a changeset in this task.

Verify all execution-plan chunks are complete and RELEASE-TRAIN-STATE.md matches Git.

Run the complete release gate from AGENTS.md, all affected package tests, built CLI help for changed commands, ESM/CJS consumer smoke, tarball inspection, and representative v0.1/v0.2/OpenInference/OTLP fixtures.

Create or update docs/implementation/release-trains/V1.6.0-RELEASE-READINESS.md with exact evidence, failures, package contents, size/performance changes, compatibility, security, and known limitations.

Draft release notes and proposed version/package changes, then stop and ask for explicit release-preparation authorization.

Do not commit, push, version, create a changeset, tag, publish, or create a GitHub release.
```

## 5. Prepare the next task without implementation

```text
Read AGENTS.md, RELEASE-TRAIN-STATE.md, and V1.6.0-EXECUTION-PLAN.md.

Audit only the next incomplete chunk. Create/update CURRENT-TASK.md with:
- one goal
- dependencies
- exact read-first files
- in scope
- out of scope
- acceptance criteria
- focused tests
- chunk gate
- proposed commit
- stop condition

Do not implement code or run broad validation. Stop after the task brief is ready.
```
