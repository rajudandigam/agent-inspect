# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "6.3.0"
publishedVersion: "6.3.0 (pending npm verify)"
currentTrain: "v6.4.0"
trainStatus: "ready"
executionMode: "autonomous-release-train"
branch: "main"
currentChunk: "v6.4-0-standards-rfc"
nextAction: "Standards graduation RFC"
completedChunks:
  - "v6.1.0 through v6.2.0"
  - "v6.3-0 through v6.3.0-version-packages"
remainingTrains:
  - "v6.4.0 Standards Graduation"
blockedTrains:
  - "v7.0.0 (conditional — not scheduled)"
lastConfirmedCommit: "pending"
lastValidationLevel: "v6.3.0-release-gate-green"
updatedAt: "2026-07-09"
```

## Quick links

- **Active plan:** [V6.4.0-EXECUTION-PLAN.md](./release-trains/V6.4.0-EXECUTION-PLAN.md)
- **v6.3 readiness:** [V6.3.0-RELEASE-READINESS.md](./release-trains/V6.3.0-RELEASE-READINESS.md)
