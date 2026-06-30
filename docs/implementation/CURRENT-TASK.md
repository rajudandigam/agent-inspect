# Current Codex Task

## Identity

```yaml
train: "v3.1.0"
chunk: "v3.1-1-make-harness-public"
status: "blocked"
executionMode: "autonomous-release-train"
dependsOn: "v3.1-0-audit-current-package-state-and-publish-verification"
```

## Goal

`@agent-inspect/harness` implementation complete; awaiting first npm publication.

## Manual gate

**MANUAL GATE — first publication / Trusted Publishing for `@agent-inspect/harness`**

Package path: `packages/harness`  
Package name: `@agent-inspect/harness`  
Expected bootstrap version: `3.0.0` (linked minor `3.1.0` at release prep)

```bash
pnpm build
mkdir -p /tmp/agent-inspect-harness-pack
pnpm --dir packages/harness pack --pack-destination /tmp/agent-inspect-harness-pack
TARBALL=$(ls /tmp/agent-inspect-harness-pack/*.tgz)
npm publish "$TARBALL" --access public
```

Trusted Publisher: `rajudandigam` / `agent-inspect` / `publish.yml`

## Next chunk (after gate)

`v3.1-2` — `agent-inspect init`
