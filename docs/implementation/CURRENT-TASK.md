# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "v1.6.0-publish-decision"
status: "ready"
dependsOn: "v1.6.0-release-preparation"
```

## Goal

Publish exactly v1.6.0 only if npm credentials, tagging, and GitHub release creation are available and safe.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-RELEASE-READINESS.md`
- package manifests and existing release scripts only

## In scope

1. Verify whether npm publish credentials are available and safe.
2. If safe and fully authenticated, publish exactly `agent-inspect@1.6.0`, `@agent-inspect/langchain@1.6.0`, and `@agent-inspect/tui@1.6.0` using the repository release process.
3. If publish succeeds, create the v1.6.0 git tag/GitHub release according to the established process.
4. If publish/tag/release is unavailable or unsafe, stop and leave state for maintainer publish.

## Out of scope

- any code, schema, dependency, or version changes
- publishing any version other than `1.6.0`
- default telemetry/upload behavior

## Acceptance criteria

- Either publish/tag/release succeeds with evidence, or the blocker is recorded clearly for the maintainer.
- No partial publish is attempted if credentials/process are unclear.
- Release-train state is updated after a successful publish or documented stop.

## Stop condition

Stop if npm authentication, OTP, package ownership, tag creation, or GitHub release creation is unavailable or unsafe.
