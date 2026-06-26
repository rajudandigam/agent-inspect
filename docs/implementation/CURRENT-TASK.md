# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-post-publish-docs"
status: "complete"
dependsOn: "v1.7-changesets-release-pr"
```

## Goal

Record the completed v1.7.0 publish, including the first-publish recovery for `@agent-inspect/ai-sdk`, and leave the repository ready for a future v1.8 planning reset.

## Completed

- `agent-inspect@1.7.0` is published.
- `@agent-inspect/ai-sdk@1.7.0` is published.
- `@agent-inspect/langchain@1.7.0` is published.
- `@agent-inspect/tui@1.7.0` is published.
- `@agent-inspect/openai-agents` remains private and unpublished.
- Future publish automation has `NPM_TOKEN` available and package-level Trusted Publisher setup for the newly published AI SDK package.

## Next task

No active implementation task is open. Start the v1.8 train with a planning/reset chunk before changing code.

## Out of scope

- package implementation changes
- package version changes
- changesets
- tags or GitHub releases
- `npm publish`, `pnpm publish`, or `changeset publish`
- default network upload behavior or hosted sinks
