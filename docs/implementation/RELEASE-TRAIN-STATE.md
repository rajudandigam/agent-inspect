# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Handoff for new agent chat:** [AGENT-HANDOFF-PROMPT.md](./AGENT-HANDOFF-PROMPT.md)

```yaml
baselineVersion: "5.4.0"
publishedVersion: "5.4.0 (17 packages; studio pending first publish)"
currentTrain: "v6.0.0"
trainStatus: "release-ready"
executionMode: "autonomous-release-train"
branch: "main"
currentChunk: "v6.0-5-release"
nextAction: "changeset version 6.0.0, push, workflow_dispatch publish; maintainer configures @agent-inspect/studio Trusted Publishing"
handoffCommit: "18ffb81"
completedChunks:
  - "v5.1.0-published (cohort v2, CI 28988054272)"
  - "v5.2.0-published (CI gates, CI 28990000097)"
  - "v5.3.0-published (suite viewer, CI 28991868139)"
  - "v5.4.0-published (suite templates, CI 28993299414)"
  - "v6.0-0-rfc (SELF-HOSTED-STUDIO-V6.0.md)"
  - "v6.0-1-scaffold (@agent-inspect/studio package + CLI studio command)"
  - "v6.0-2-workspace-views"
  - "v6.0-3-search-diff-reports"
  - "v6.0-4-auth-binding"
  - "v6.0-5-release-readiness"
remainingTrains:
  - "v6.1.0 Client-hosted Ingestion"
  - "v6.2.0 Plugin Convention"
  - "v6.3.0 MCP Coding-agent Workflows"
  - "v6.4.0 Standards Graduation"
blockedTrains:
  - "v7.0.0 (conditional — not scheduled)"
pendingManualGate:
  - "@agent-inspect/studio first npm publication + Trusted Publishing (maintainer)"
  - "VS Code Marketplace first publish (packages/vscode)"
  - "Studio auth / non-localhost binding security review"
lastConfirmedCommit: "18ffb81"
lastPublishRun: "28993299414 (workflow_dispatch, success)"
lastValidationLevel: "full gate green pre-6.0.0 release"
updatedAt: "2026-07-09"
```

## Quick links

- **Active plan:** [V6.0.0-EXECUTION-PLAN.md](./release-trains/V6.0.0-EXECUTION-PLAN.md)
- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md) (read § v6 only when needed)
- **Maintainer rules:** [AGENTS.md](../../AGENTS.md) at repo root
