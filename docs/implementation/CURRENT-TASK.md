# Current Codex Task

## Identity

```yaml
train: "v2.4.0"
chunk: "v2.4-mcp-first-publish-bootstrap"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.4-version-packages-pr-and-publication"
```

## Goal

Complete v2.4 publication by first-publishing `@agent-inspect/mcp@2.4.0` on npm (Trusted Publisher + initial publish), then re-run Publish workflow.

## Maintainer steps

1. `pnpm build` at repo root
2. `cd packages/mcp && npm publish --access public` (maintainer npm account)
3. Add Trusted Publisher on npm for `@agent-inspect/mcp` → `publish.yml`
4. `gh workflow run publish.yml --ref main`

## Suggested Commit

```text
docs: record v2.4 partial publication and mcp bootstrap gate
```
