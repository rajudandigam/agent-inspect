# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.31.46"
publishedVersion: "6.31.46"
pendingPublishVersion: "6.31.46"
currentTrain: "n6-n7-docs-diagnostics"
trainStatus: "N5 published 6.31.45; N6+N7 gated — Frank design + finding preview/docs"
executionMode: "maintainer-reviewed"
namedTrain: "n6-n7-docs-diagnostics"
branch: "main"
currentChunk: "N6 design + N7 docs/diagnostics"
lastConfirmedCommit: "ee7944cb9692efc4f04e24cc210391c658857372"
lastValidationLevel: "N5 Trusted Publish 45304159487; npm 6.31.45; N7 typecheck+focused tests+build"
nextAction: "Push N6+N7; merge Version Packages; verify npm 6.31.46; leave #496/#506 red"
pendingManualGate: "EVIDENCE_GATE not approved; Indu v3 artifact missing; #484/#437 partner fields"
githubIssues:
  "481": "closed — W01 Promptfoo identity"
  "482": "closed — W01 OTLP AnyValues"
  "483": "closed — W01 kit resolved pin"
  "490": "closed — W23A ROADMAP/COMPARE sync"
  "209": "open — packed OS/Node matrix; keep open; 6.31.17 includes #473"
  "484": "open — W04; Prompt A + residuals shipped in 6.31.23; partner packet remains"
  "485": "open — W05; synthetic browser-mcp-observed-outcomes covers binding/forged-label/ablation; webmcp-native-evidence recipe now asserts outcomes+Evidence; packed-main gen_ai.tool.name probe OK; native Trip proof still host-blocked — do not close on maintainer-only synthetic runs"
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
  - "6.31.38 C0+C0P verified-tarball Trusted Publish"
  - "6.31.39 C1a #544 + C1b #543 token-budget fail-closed"
  - "6.31.40 open-PR triage — #559/#558 traceSafety + #547/#533 LangChain tokenUsage (Publish 44942237531)"
  - "N1 malformed token-budget fail-closed (6.31.41 Publish 45112687091)"
  - "N2 eval/check logical-call token-budget parity (6.31.42 Publish 45259714561)"
  - "N3 ordering/refund + Frank cases (6.31.43 Publish 45294868131)"
  - "N4 Gary/Uduak/Roy/Om saved-evidence repairs (6.31.44 Publish 45300605347)"
  - "N5 Kyle timeout correlated read-back (6.31.45 Publish 45304159487)"
  - "N6 Frank acceptance design (PROPOSED-527; no public API)"
queuedChunks:
  - "N7 docs/diagnostics (pending 6.31.46)"
  - "W04/#484 partner acceptance of -003 packet"
  - "W05/#485 residual if any after Om diagnostics"
  - "W22 C10 Elastic / Collector Docker when credentials"
  - "6.32.0 external-evidence gate (BLOCKED)"
blockedTrains:
  - "v7.0.0 (assessment only — V7_DECISION: NO-GO)"
  - "6.32.0 until EVIDENCE_GATE approved"
amendments:
  - "Adoption freeze excluded"
  - "2026-11-21 6.31.40 published (Trusted Publish 44942237531); #548 superseded; leave #496/#506 red"
  - "2026-11-22 6.31.41 published (Trusted Publish 45112687091); N1 malformed budget fail-closed"
  - "2026-11-23 6.31.42 published (Trusted Publish 45259714561); N2 eval/check logical-call token-budget parity"
  - "2026-11-23 6.31.43 published (Trusted Publish 45294868131); N3 unfinished-after order + refund identity joins"
  - "2026-11-24 6.31.44 published (Trusted Publish 45300605347); N4 Gary/Uduak/Roy/Om saved-evidence repairs"
  - "2026-11-24 6.31.45 published (Trusted Publish 45304159487); N5 Kyle timeout correlated read-back"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  LAST_PUBLISHED_RELEASE: 6.31.45
  PENDING_PUBLISH: 6.31.46
  ACTIVE: N6+N7 push → Version Packages → Trusted Publish; leave #496/#506 red
  NEXT: no 6.32 without EVIDENCE_GATE
  V7_DECISION: NO-GO
  EVIDENCE_GATE: not approved
  ADOPTION_FREEZE: excluded
updatedAt: "2026-11-24"
```
