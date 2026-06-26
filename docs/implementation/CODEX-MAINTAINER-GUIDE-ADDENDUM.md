# Maintainer Guide Addendum

Add this section after `## Chunk lifecycle`.

```md
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
```
