# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Handoff for new agent chat:** [AGENT-HANDOFF-PROMPT.md](./AGENT-HANDOFF-PROMPT.md)

```yaml
baselineVersion: "6.1.0"
publishedVersion: "6.1.0"
currentTrain: "v6.2.0"
trainStatus: "release-prep"
executionMode: "autonomous-release-train"
branch: "main"
currentChunk: "v6.2-5-release-readiness"
nextAction: "Version Packages + publish 6.2.0"
completedChunks:
  - "v6.1-0-rfc through v6.1.0-version-packages"
  - "v6.2-0-plugin-rfc"
  - "v6.2-1-manifest-validator"
  - "v6.2-2-conformance (pre-existing adapter-sdk)"
  - "v6.2-3-privacy-checklist (pre-existing adapter-sdk)"
  - "v6.2-4-plugins-cli"
  - "v6.2-5-release-readiness"
  - "v6.2.0-version-packages"
remainingTrains:
  - "v6.3.0 MCP Coding-agent Workflows"
  - "v6.4.0 Standards Graduation"
blockedTrains:
  - "v7.0.0 (conditional — not scheduled)"
pendingManualGate:
  - "VS Code Marketplace first publish (packages/vscode)"
  - "Studio non-localhost binding security review"
lastConfirmedCommit: "4c61b00"
lastValidationLevel: "v6.2-chunk-gate-green"
updatedAt: "2026-07-09"
```

## Quick links

- **Active plan:** [V6.2.0-EXECUTION-PLAN.md](./release-trains/V6.2.0-EXECUTION-PLAN.md)
- **v6.2 readiness:** [V6.2.0-RELEASE-READINESS.md](./release-trains/V6.2.0-RELEASE-READINESS.md)
- **Maintainer rules:** [AGENTS.md](../../AGENTS.md) at repo root
