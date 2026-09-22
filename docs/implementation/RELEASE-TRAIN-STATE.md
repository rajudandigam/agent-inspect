# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.31.5"
publishedVersion: "6.31.5"
pendingPublishVersion: null
currentTrain: "maintenance-after-6313"
trainStatus: "open-pr-pending-review"
executionMode: "maintainer-reviewed"
namedTrain: "website-correctness-post-6310"
branch: "codex/trace-filesystem-permissions"
currentChunk: "restrictive POSIX create modes + combined UTF-8/permissions patch Changeset"
lastConfirmedCommit: "4d23972c"
lastValidationLevel: "pending focused + full gate on permissions PR"
nextAction: "Maintainer review of permissions PR; no npm publish; do not consume 6.32.0"
pendingManualGate: "6.32.0 partner evidence; #422 factual review"
githubIssues:
  "209": "keep open — cross-platform packed-consumer matrix PARTIAL"
  "435": "open — restrictive trace filesystem permissions (this PR)"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "6.31.0 typed cross-kind step ordering + Trusted Publish"
  - "P04 website repair (A–F)"
  - "6.31.1 status validation + prepublish skip + LangChain parentage"
  - "6.31.2 README / AI SDK / Jest observation-flag docs"
  - "6.31.3 OTLP BigInt unixNano timestamps"
  - "Merge #434 UTF-8 tail --file"
blockedTrains:
  - "6.32.0 external conformance (BLOCKED_ON_EXTERNAL_EVIDENCE)"
  - "v7.0.0 (assessment only — V7_DECISION: NO-GO)"
amendments:
  - "Post-6.31.0 website-first train executed through 6.31.3"
  - "Do not invent or consume reserved 6.32.0"
  - "Next maintenance Changeset is 6.31.x patch only"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  LAST_PUBLISHED_RELEASE: 6.31.3
  ACTIVE: maintenance PR open
  RESERVED: 6.32.0 BLOCKED_ON_EXTERNAL_EVIDENCE
  V7_DECISION: NO-GO
  EVIDENCE_GATE: not approved
updatedAt: "2026-09-19"
```
