# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.31.27"
publishedVersion: "6.31.27"
pendingPublishVersion: "6.31.28"
currentTrain: "stability-after-63111"
trainStatus: "6.31.28 pending publish (starter order relation); 6.32 blocked"
executionMode: "maintainer-reviewed"
namedTrain: "stability-after-63111"
branch: "main"
currentChunk: "04 starter order — Version Packages → publish"
lastConfirmedCommit: "495e9f3d"
lastValidationLevel: "starter prove-same-output-wrong-path S01–S06 exit 0"
nextAction: "Merge Version Packages for 6.31.28; then item 05 Gary cohort; hold Indu/Swapnil/João/email; no 6.32 without EVIDENCE_GATE"
pendingManualGate: "EVIDENCE_GATE not approved; Elastic --live (C10); Collector Docker"
githubIssues:
  "481": "closed — W01 Promptfoo identity"
  "482": "closed — W01 OTLP AnyValues"
  "483": "closed — W01 kit resolved pin"
  "490": "closed — W23A ROADMAP/COMPARE sync"
  "209": "open — packed OS/Node matrix; keep open; 6.31.17 includes #473"
  "484": "open — W04; Prompt A + residuals shipped in 6.31.23; partner packet remains"
  "485": "open — W05 browser observer binding"
  "486": "open — W06 paired captures"
  "487": "open — W27 private Promptfoo deps"
  "488": "open — W18 MCP SDK packed consumer; isError outcome in 6.31.26"
  "494": "open — packed harness PR; canonical script is packed-mcp-sdk-e2e; do not merge a second harness"
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
  - "6.31.18–6.31.20 Fix-Owes + Oct 11 MCP/fixture owes"
  - "W23A #490 ROADMAP/COMPARE/active-plan pointer sync"
  - "6.31.21 MCP options+metadata compose; SDK Client TS; Roy O05 redelivery"
  - "6.31.22 Prompt A identity fidelity (#484 matrix) (3f02b619 → #502 → Publish)"
  - "6.31.23 Prompt A residuals — compare-before-bound + delivery_event_base (297b1f11 → #503 → Publish)"
  - "6.31.24 MCP runId and legacy slowest-path descriptions (9058e646 → #508 → Publish)"
  - "6.31.25 strict stack/errorStack/stackTrace redaction (67563a29 → #509 → Publish)"
  - "6.31.26 MCP isError tool-result outcome (4dc95886 → #510 → Publish)"
  - "6.31.27 timeout-ledger saved-trace verifier (473c9188 → #511 → Publish)"
queuedChunks:
  - "W04/#484 residual partner packet"
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
  - "2026-10-28 scoped maintainer-requested evidence links: docs/evidence/2026-10-22; historical 6.31.23 excerpts only; external acceptance and release gates unchanged"
  - "Adoption freeze excluded"
  - "2026-10-07 6.31.17 published; W02 merged; W11 skip empty patch"
  - "2026-10-12 6.31.21 published (Trusted Publish 38204663903)"
  - "2026-10-14 6.31.22 published (Trusted Publish 38649811477)"
  - "2026-10-15 6.31.23 published (Trusted Publish 38810913852)"
  - "2026-10-24 6.31.24 published (Trusted Publish 40165917348)"
  - "2026-10-25 6.31.25 published (Trusted Publish 40215892935)"
  - "2026-10-25 6.31.26 published (Trusted Publish 40219491873)"
  - "2026-10-25 6.31.27 published (Trusted Publish 40222772749)"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  LAST_PUBLISHED_RELEASE: 6.31.27
  PENDING_PUBLISH: 6.31.28
  ACTIVE: Version Packages → Trusted Publish; then item 05
  NEXT: item 05 comparable cohort; no 6.32 without EVIDENCE_GATE
  V7_DECISION: NO-GO
  EVIDENCE_GATE: not approved
  ADOPTION_FREEZE: excluded
updatedAt: "2026-10-25"
```
