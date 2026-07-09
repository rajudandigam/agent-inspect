# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "6.4.0"
publishedVersion: "6.4.0 (pending npm verify)"
currentTrain: "none"
trainStatus: "complete"
executionMode: "autonomous-release-train"
branch: "main"
currentChunk: "v7-readiness-assessment"
nextAction: "Monitor adoption gates before scheduling v7"
completedChunks:
  - "v6.1.0 client-hosted ingestion"
  - "v6.2.0 plugin convention"
  - "v6.3.0 MCP workflows"
  - "v6.4.0 standards graduation"
  - "v7.0.0 readiness assessment (not scheduled)"
blockedTrains:
  - "v7.0.0 (conditional — adoption gates not met)"
lastConfirmedCommit: "pending"
lastValidationLevel: "v6.4.0-release-gate-green"
updatedAt: "2026-07-09"
```

## Quick links

- **v6.4 readiness:** [V6.4.0-RELEASE-READINESS.md](./release-trains/V6.4.0-RELEASE-READINESS.md)
- **v7 assessment:** [V7.0.0-READINESS-ASSESSMENT.md](./release-trains/V7.0.0-READINESS-ASSESSMENT.md)
