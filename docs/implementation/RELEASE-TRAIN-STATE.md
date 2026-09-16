# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.29.3"
publishedVersion: "6.29.3"
pendingPublishVersion: null
currentTrain: "adoption-after-6291-published"
trainStatus: "blocked-external"
executionMode: "maintainer-reviewed"
namedTrain: "agentinspect-adoption-after-6291-v6.29.2-to-v6.32"
branch: "main"
currentChunk: "published-6292-stop"
lastConfirmedCommit: "4756c065"
lastValidationLevel: "Trusted Publish 6.29.2 (scoped via 35066572853; root via workflow_dispatch 35068189474)"
nextAction: "Keep 6.30+ blocked until EVIDENCE GATE APPROVED; maintenance-only otherwise"
pendingManualGate: "main branch protection; Dependabot majors close/split independently"
githubIssues:
  "209": "keep open — cross-platform packed-consumer matrix PARTIAL"
  "411": "closed by suite-init fix in 6.29.2"
  "413": "MCP split runtime — shipped in 6.29.2"
  "414": "nested metadata arguments — shipped in 6.29.2"
  "415": "bounded error codes — shipped in 6.29.2"
  "416": "OpenAI cached tokens — shipped in 6.29.2"
  "417": "browser observer — shipped in 6.29.2"
  "418": "Evidence fixtures — shipped in 6.29.2"
  "419": "Glama pin/non-root — shipped in 6.29.2"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "prior train through 6.29.1 published"
  - "adoption train activated"
  - "6.29.2–6.29.3 themes published as agent-inspect@6.29.2 (Trusted Publish)"
blockedTrains:
  - "6.30.0 portable Evidence / interop (BLOCKED_ON_6_30_EXTERNAL_INPUTS)"
  - "6.31.0 failure-first review UX (BLOCKED_ON_6_31_REVIEW_FIXTURE)"
  - "6.32.0 external conformance (BLOCKED_ON_EXTERNAL_EVIDENCE)"
  - "v7.0.0 (assessment only — V7_DECISION: NO-GO)"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  BLOCKED_ON_EXTERNAL_EVIDENCE (for inventing 6.30.0+)
  LAST_PUBLISHED_RELEASE: 6.29.2
  V7_DECISION: NO-GO
updatedAt: "2026-09-16"
```
