# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.31.10"
publishedVersion: "6.31.10"
pendingPublishVersion: null
currentTrain: "suite-context-trust-after-6318"
trainStatus: "active"
executionMode: "maintainer-reviewed"
namedTrain: "suite-context-trust-after-6318"
branch: "main"
currentChunk: "C05 API misuse diagnostics (next)"
lastConfirmedCommit: "4190982a"
lastValidationLevel: "publish 36286862048 success; npm 6.31.9 all packages"
nextAction: "Implement C05 actionable API misuse diagnostics"
pendingManualGate: "Elastic --live credentials; external Promptfoo reproduction; EVIDENCE_GATE not approved; proactive-ai-demo C03–C04; D01 docs"
githubIssues:
  "450": "open — permission granted; private v3 qualified; partner Revera pending"
  "437": "open — receipt/idempotency; later evidence train"
  "209": "open — packed OS/Node matrix"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "6.31.9 suite assertion integrity + CJS context (#464/#465)"
  - "6.31.8 integration honesty (#462/#463)"
  - "6.31.7 timeline + export/OTLP train (#459/#460)"
queuedChunks:
  - "C05 API misuse diagnostics"
  - "C06 explain logical lifecycle counts"
  - "C07 rule/outcome summary clarity"
  - "C08 direct OpenAI Node recipe"
  - "C09 expected semantic-failure suite asserts"
  - "C10 Nest Evidence v2 path"
  - "C11 safety precision"
  - "C12 input provenance extensions"
  - "C13 broader consumers (split)"
  - "Demo C03–C04 (proactive-ai-demo)"
  - "D01 docs/examples capture package"
blockedTrains:
  - "v7.0.0 (assessment only — V7_DECISION: NO-GO)"
amendments:
  - "Adoption freeze excluded"
  - "P03 still blocked (no audit probes)"
  - "Recipe layout ≠ destination verification"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  LAST_PUBLISHED_RELEASE: 6.31.9
  ACTIVE: suite-context-trust-after-6318
  NEXT: C05 API misuse diagnostics
  V7_DECISION: NO-GO
  EVIDENCE_GATE: not approved
  ADOPTION_FREEZE: excluded
updatedAt: "2026-09-27"
```
