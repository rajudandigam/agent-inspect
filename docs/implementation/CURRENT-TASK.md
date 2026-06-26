# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-21-first-openai-package-publication-and-linked-release"
status: "blocked_on_maintainer_release_authority"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-20-release-readiness"
```

## Goal

Prepare and validate the `@agent-inspect/openai-agents@1.8.0` first-publication path, then stop for maintainer publication/verification authority before any version, changeset, tag, GitHub release, or npm publish action.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.8.0-RELEASE-READINESS.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 21
- `docs/community/MAINTAINER-GUIDE.md` first scoped-package publication guidance, if needed

## In scope

1. Confirm maintainer authorization before any release operation.
2. Prepare and validate the OpenAI Agents package tarball contents for first public publication.
3. Document exact maintainer publication steps and expected post-publication verification.
4. After maintainer publication and resume, verify npm registry/package evidence and prepare linked-release Changesets work only with explicit authorization.

## Out of scope without explicit maintainer authorization

- changing package versions;
- adding or applying changesets;
- removing `private: true` from any package;
- npm publish, tag creation, GitHub release creation, or release note conversion;
- pushing release/version commits or merging release PRs;
- hosted upload behavior, GitHub API comments, provider execution, replay, raw content capture, or persisted schema changes.

## Acceptance criteria

- release authority is explicit before any release-affecting action;
- OpenAI Agents package contents are validated before first publication;
- maintainer has clear manual publication and verification evidence requirements;
- no unauthorized version, changeset, tag, release, publish, or package publish-status change occurs.

## Proposed commit

```text
docs: verify v1.8.0 publication
```

## Stop condition

Stop immediately unless the maintainer explicitly authorizes release operations. Also stop on any validation failure, package-content surprise, registry mismatch, or decision that would expand into unapproved publication/version/tag/release behavior.
