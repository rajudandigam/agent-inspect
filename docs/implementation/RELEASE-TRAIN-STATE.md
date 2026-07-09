# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Handoff for new agent chat:** [AGENT-HANDOFF-PROMPT.md](./AGENT-HANDOFF-PROMPT.md)

```yaml
baselineVersion: "5.4.0"
publishedVersion: "6.0.0 (17/18 packages on npm; @agent-inspect/studio pending Trusted Publishing)"
currentTrain: "v6.1.0"
trainStatus: "ready"
currentChunk: "v6.1-0-rfc"
nextAction: "Client-hosted ingestion RFC; then v6.1 implementation chunks"
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
  - "v6.0.0-published (17 packages CI 29039791803; studio manual gate)"
lastConfirmedCommit: "f35a704"
lastPublishRun: "29039791803 (workflow_dispatch; 17/18 published; studio E404 expected)"
updatedAt: "2026-07-09"
```

## Quick links

- **Active plan:** [V6.0.0-EXECUTION-PLAN.md](./release-trains/V6.0.0-EXECUTION-PLAN.md)
- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md) (read § v6 only when needed)
- **Maintainer rules:** [AGENTS.md](../../AGENTS.md) at repo root
