# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.31.35"
publishedVersion: "6.31.35"
pendingPublishVersion: "6.31.35"
currentTrain: "nov4-audit-fix-train"
trainStatus: "6.31.34 published; C12–C16 ready for 6.31.35 Version Packages"
executionMode: "maintainer-reviewed"
namedTrain: "nov4-audit-fix-train"
branch: "main"
currentChunk: "C16 trust-boundary docs — await Version Packages publish"
lastConfirmedCommit: "1459b1f7"
lastValidationLevel: "C12–C16 landed on main; recipes validated"
nextAction: "Merge Version Packages PR for 6.31.35; confirm npm; no 6.32 without EVIDENCE_GATE"
pendingManualGate: "EVIDENCE_GATE not approved; Indu v3 artifact missing; #484/#437 partner fields"
githubIssues:
  "481": "closed — W01 Promptfoo identity"
  "482": "closed — W01 OTLP AnyValues"
  "483": "closed — W01 kit resolved pin"
  "490": "closed — W23A ROADMAP/COMPARE sync"
  "209": "open — packed OS/Node matrix; keep open; 6.31.17 includes #473"
  "484": "open — W04; Prompt A + residuals shipped in 6.31.23; partner packet remains"
  "485": "open — W05 browser observer binding"
  "486": "closed — W06 one-pass verifier + recipe shipped in 6.31.29"
  "487": "open — W27 private Promptfoo deps"
  "488": "closed — satisfied by scripts/packed-mcp-sdk-e2e.mjs; do not merge #494"
  "494": "open — packed harness PR; canonical script is packed-mcp-sdk-e2e; do not merge a second harness"
  "489": "open — W28 effect-label fixture"
  "491": "closed — valid-variable-paths recipe verified + indexed"
  "492": "closed — timeout-ledger recipe + saved probes shipped 6.31.27–6.31.29"
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
  - "6.31.28 starter tool-before-answer orderRelations (e65e9445 → #512 → Publish 40939596146)"
  - "6.31.29 recipe evidence integrity (dcd714dc → #514 → Publish 40943406555)"
  - "6.31.30 Oct 29 Nest/HTML/Om + evidence packets (#515 → Publish 40965172063)"
  - "6.31.31 Oct 30 residuals R1–R6/N1–N2 (1ca1c119 → #516 → Publish 41174039799)"
  - "6.31.32 overnight #517/#518/#519/#520/#523 (d9ab3e98 → #524 → Publish 41220820360)"
  - "6.31.33 #521/#522 unfinished order + lookalike findings (b2adf039 → #525 → Publish 41226295704)"
  - "chunk 03 Nest SupportService consumption from saved evidence (N01–N08)"
  - "chunk 04 HTML lifecycle presentation join + CLI steps.orderRelations docs"
  - "chunk 05 Om wait/readiness diagnostics"
  - "chunk 06 timeout-ledger terminology"
  - "chunk 07 #494 packed-mcp-sdk reconcile note (do not merge #494)"
  - "chunk 08 Roy -003 OTLP identity packet"
  - "chunk 09 PROPOSED #437 receipt contract (awaiting maintainer fields)"
  - "chunk 10 Indu v3 BLOCKED — exact artifact missing"
  - "chunk 11 #487 dependency decision — no safe slice"
  - "chunk 12A #491 audit — ready for maintainer closure review"
queuedChunks:
  - "W04/#484 partner acceptance of -003 packet"
  - "W05/#485 residual if any after Om diagnostics"
  - "W22 C10 Elastic / Collector Docker when credentials"
  - "6.32.0 external-evidence gate (BLOCKED)"
blockedTrains:
  - "v7.0.0 (assessment only — V7_DECISION: NO-GO)"
  - "6.32.0 until EVIDENCE_GATE approved"
amendments:
  - "Adoption freeze excluded"
  - "2026-10-07 6.31.17 published; W02 merged; W11 skip empty patch"
  - "2026-10-12 6.31.21 published (Trusted Publish 38204663903)"
  - "2026-10-14 6.31.22 published (Trusted Publish 38649811477)"
  - "2026-10-15 6.31.23 published (Trusted Publish 38810913852)"
  - "2026-10-24 6.31.24 published (Trusted Publish 40165917348)"
  - "2026-10-25 6.31.25 published (Trusted Publish 40215892935)"
  - "2026-10-25 6.31.26 published (Trusted Publish 40219491873)"
  - "2026-10-25 6.31.27 published (Trusted Publish 40222772749)"
  - "2026-10-29 6.31.28 published (Trusted Publish 40939596146)"
  - "2026-10-29 6.31.29 published (Trusted Publish 40943406555)"
  - "2026-10-29 6.31.30 published (Trusted Publish 40965172063)"
  - "2026-10-31 6.31.31 published (Trusted Publish 41174039799)"
  - "2026-10-31 6.31.32 published (Trusted Publish 41220820360)"
  - "2026-10-31 6.31.33 published (Trusted Publish 41226295704)"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  LAST_PUBLISHED_RELEASE: 6.31.34
  PENDING_PUBLISH: 6.31.35 (C12–C16)
  ACTIVE: Version Packages for 6.31.35; partner #484/#437 hold
  NEXT: leave #496/#506 red; no 6.32 without EVIDENCE_GATE
  V7_DECISION: NO-GO
  EVIDENCE_GATE: not approved
  ADOPTION_FREEZE: excluded
updatedAt: "2026-11-04"
```

