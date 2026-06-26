# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-21-first-openai-package-publication-and-linked-release"
status: "release_workflow_prepared"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-20-release-readiness"
```

## Goal

Prepare and validate the `@agent-inspect/openai-agents@1.8.0` first-publication path, then use the maintainer-authorized GitHub/Changesets release workflow to publish v1.8.0 only after green CI.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.8.0-RELEASE-READINESS.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 21
- `docs/community/MAINTAINER-GUIDE.md` first scoped-package publication guidance, if needed

## In scope

1. Confirm maintainer authorization before any release operation.
2. Prepare and validate the OpenAI Agents package tarball contents for first public publication.
3. Configure Changesets so `agent-inspect`, LangChain, TUI, AI SDK, and OpenAI Agents move to `1.8.0` together.
4. Keep Vitest and Jest private/unpublished and ignored by the release workflow.
5. Push release prep, validate the generated Version Packages PR with green CI, merge, and verify npm/tags/releases.

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

Stop immediately on any validation failure, package-content surprise, registry mismatch, failed CI, missing workflow credentials, partial publication, or decision that would expand into unapproved package/version/tag/release behavior.

## Chunk 21 evidence

- Maintainer authorization received: "looks good, go ahead publish".
- Local npm first-publish attempt blocked before publish: `npm whoami` returned `E401`.
- Validated exact OpenAI Agents `1.8.0` tarball by temporarily setting the package version, building, packing, inspecting the packed manifest, and running `npm publish --dry-run --access public`.
- Switched to the repository Changesets publish workflow: OpenAI Agents is public in source at the current `1.7.0` baseline, linked into the v1.8 public package group, and included in the v1.8 changeset.
- Changesets status reports exactly these minor bumps to `1.8.0`: `agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`, `@agent-inspect/ai-sdk`, and `@agent-inspect/openai-agents`.
- `@agent-inspect/vitest` and `@agent-inspect/jest` remain private and are explicitly ignored by Changesets.
