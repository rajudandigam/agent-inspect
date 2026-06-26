# Resume Prompt After Manual OpenAI Package Publication

```text
Read AGENTS.md first.

The maintainer completed the authorized manual first publication of @agent-inspect/openai-agents@1.8.0.

Verify:

git status --short
git branch --show-current
git log -5 --oneline
git diff --check
npm view @agent-inspect/openai-agents@1.8.0 version
npm view @agent-inspect/openai-agents dist-tags --json
npm view @agent-inspect/openai-agents@1.8.0 dependencies peerDependencies --json

Require a clean main branch and exact registry version 1.8.0. Inspect the published tarball/package metadata when possible. Stop on any mismatch.

Then resume chunk 21 of docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md:

1. record the manual first-publication evidence in V1.8.0-RELEASE-READINESS.md;
2. configure future Changesets linkage for @agent-inspect/openai-agents without causing a second 1.8.0 bump;
3. create the correct changeset for public packages still requiring 1.8.0;
4. push main and let Changesets create/update the Version Packages PR;
5. inspect package versions, changelogs, dependency rewrites, and files;
6. require green CI and release gates;
7. merge the PR;
8. verify npm versions, dist-tags, packed contents, package tags, and GitHub releases;
9. update ROADMAP.md, RELEASE-TRAIN-STATE.md, CURRENT-TASK.md, and V1.8.0-RELEASE-READINESS.md to published;
10. commit and push the final documentation correction if required.

Do not publish locally, force-push, bypass CI, or recreate an already published package version. Stop on partial publication, registry inconsistency, unexpected version changes, missing credentials, or failed CI.
```
