# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "6.4.0"
publishedVersion: "6.4.0 (pending npm verify)"
currentTrain: "none"
trainStatus: "complete"
executionMode: "autonomous-release-train"
branch: "main"
currentChunk: "publish-unblock"
nextAction: "Confirm Publish CI green and npm @ 6.4.0"
completedChunks:
  - "v6.1.0 through v6.4.0 implementation"
  - "v7.0.0 readiness assessment (not scheduled)"
  - "lockfile fix for v6.4 recipes"
  - "linked-package version alignment (redact/circuit/guardrails)"
blockedTrains:
  - "v7.0.0 (conditional — adoption gates not met)"
lastConfirmedCommit: "pending"
lastValidationLevel: "pack-smoke-green"
updatedAt: "2026-07-09"
```

## Quick links

- **v6.4 readiness:** [V6.4.0-RELEASE-READINESS.md](./release-trains/V6.4.0-RELEASE-READINESS.md)
- **v7 assessment:** [V7.0.0-READINESS-ASSESSMENT.md](./release-trains/V7.0.0-READINESS-ASSESSMENT.md)
