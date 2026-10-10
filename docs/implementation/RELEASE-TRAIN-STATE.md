# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.31.18"
publishedVersion: "6.31.18"
pendingPublishVersion: null
currentTrain: "stability-after-63111"
trainStatus: "6.31.18 published all 18; Fix-Owes complete for shippable scope; 6.32 blocked"
executionMode: "maintainer-reviewed"
namedTrain: "stability-after-63111"
branch: "main"
currentChunk: "post-6.31.18 residuals"
lastConfirmedCommit: "6c2ab366"
lastValidationLevel: "npm 6.31.18 ×18; Publish runs 38074155181 + 38075524297 success"
nextAction: "Partner packets / plumbline #98; no 6.32 without EVIDENCE_GATE"
pendingManualGate: "EVIDENCE_GATE not approved; Elastic --live (C10); Collector Docker"
githubIssues:
  "481": "closed — W01 Promptfoo identity"
  "482": "closed — W01 OTLP AnyValues"
  "483": "closed — W01 kit resolved pin"
  "490": "open — W23A ROADMAP/COMPARE sync"
  "209": "open — packed OS/Node matrix; keep open; 6.31.17 includes #473"
  "484": "open — W04 OTLP operation/attempt identity"
  "485": "open — W05 browser observer binding"
  "486": "open — W06 paired captures"
  "487": "open — W27 private Promptfoo deps"
  "488": "open — W18 MCP SDK packed consumer"
  "489": "open — W28 effect-label fixture"
  "491": "open — W15 valid variable paths"
  "492": "open — W10 timeout-after-commit"
  "450": "open — W09 permission granted; partner Revera pending"
  "437": "open — W20A receipt/idempotency; later evidence train"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "W02 proactive-ai-demo #6 #7 #8 merged"
  - "W01 Promptfoo/OTLP/kit (9bf8859e)"
  - "6.31.17 W26 marker + Windows #473 (#493 publish)"
  - "W00 Oct 7 reconcile"
  - "W03 packed-matrix honesty wording"
  - "W11 recovery replay green — skip empty 6.31.18"
queuedChunks:
  - "W23A finish #490 COMPARE/ROADMAP pointer sync"
  - "W04/#484 identity packet + Robb/Roy drafts after artifacts"
  - "W05/#485 browser observer controls"
  - "W06/#486 paired captures"
  - "W15/#491 valid-variable-path matrix"
  - "W10/#492 timeout-after-commit"
  - "W22 C10 Elastic / Collector Docker when credentials"
  - "6.32.0 external-evidence gate (BLOCKED)"
blockedTrains:
  - "v7.0.0 (assessment only — V7_DECISION: NO-GO)"
  - "6.32.0 until EVIDENCE_GATE approved"
amendments:
  - "Adoption freeze excluded"
  - "2026-10-07 6.31.17 published; W02 merged; W11 skip empty patch"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  LAST_PUBLISHED_RELEASE: 6.31.17
  ACTIVE: stability-after-63111 (Oct 7; post-W02)
  NEXT: W04+ artifacts; no 6.32 without EVIDENCE_GATE
  V7_DECISION: NO-GO
  EVIDENCE_GATE: not approved
  ADOPTION_FREEZE: excluded
updatedAt: "2026-10-07"
```
