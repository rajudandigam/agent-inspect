# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-release-readiness"
status: "ready"
dependsOn: "v1.7-adapter-conformance-fixture-matrix"
```

## Goal

Prepare the v1.7 release-readiness gate after all approved adapter chunks land.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.7-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V1.6.0-RELEASE-READINESS.md`
- directly related README/API/CLI/SCHEMA/LIMITATIONS/KNOWN-ISSUES/CHANGELOG/package metadata files only

## In scope

1. Align README/API/CLI/SCHEMA/LIMITATIONS/KNOWN-ISSUES/CHANGELOG as needed for v1.7.
2. Create `docs/implementation/release-trains/V1.7.0-RELEASE-READINESS.md` with exact validation evidence.
3. Run the required release-readiness gate.
4. Decide whether package/version/changelog release-preparation changes are safe under the existing Changesets workflow.

## Out of scope

- publishing from the local machine
- creating git tags or GitHub releases manually
- live provider calls, network upload behavior, hosted sinks
- runtime implementation beyond the completed chunks
- root/core dependencies on AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, or LangChain

## Acceptance criteria

- Release-readiness evidence exists and matches executed commands.
- Package/version strategy is documented.
- Full release gate and package smoke checks pass.
- State file records whether release preparation is pending or complete.

## Stop condition

Stop if validation fails for a reason outside current scope, package metadata is unsafe, publishing credentials are required locally, or release preparation would conflict with the repository's auto-publish Changesets workflow.
