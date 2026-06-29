# Current Codex Task

## Identity

```yaml
train: "v2.5.0"
chunk: "v2.5-guardrails-circuit-first-publish-bootstrap"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.5-version-packages-pr-and-publication"
```

## Goal

Complete v2.5 publication after verify-gate fix and maintainer first-publish for `@agent-inspect/guardrails` and `@agent-inspect/circuit`.

## Maintainer steps

1. Merge vitest alias fix on `main`
2. Re-run `gh workflow run publish.yml --ref main` (expect partial failure on new packages)
3. First-publish `@agent-inspect/guardrails@2.5.0` and `@agent-inspect/circuit@2.5.0`; add Trusted Publisher entries
4. Re-run Publish workflow

## Suggested Commit

```text
fix: add vitest aliases for guardrails and circuit packages
```
