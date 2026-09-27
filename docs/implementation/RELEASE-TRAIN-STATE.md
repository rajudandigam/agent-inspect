# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.31.9"
publishedVersion: "6.31.9"
pendingPublishVersion: null
currentTrain: "suite-context-trust-after-6318"
trainStatus: "active"
executionMode: "maintainer-reviewed"
namedTrain: "suite-context-trust-after-6318"
branch: "main"
currentChunk: "C01 suite assertion integrity + C02 packed CJS context identity (implemented; review)"
lastConfirmedCommit: "188b3922"
lastValidationLevel: "core chunk gate green (typecheck/test/coverage/size/test:all/fixtures:check/pack:smoke)"
nextAction: "Maintainer review of C01+C02; Changeset when authorized; next chunk C05 API diagnostics"
pendingManualGate: "Elastic --live credentials; external Promptfoo reproduction; EVIDENCE_GATE not approved; proactive-ai-demo C03–C04; D01 docs"
githubIssues:
  "450": "open — permission granted; private v3 qualified; partner Revera pending"
  "437": "open — receipt/idempotency; later evidence train"
  "209": "open — packed OS/Node matrix"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "6.31.8 integration honesty (#462/#463)"
  - "6.31.7 timeline + export/OTLP train (#459/#460)"
  - "6.31.6 false-SAFE marker-slash + multihost MongoDB (#455/#456)"
queuedChunks:
  - "C05 API misuse diagnostics"
  - "C06 explain logical lifecycle counts"
  - "C07 rule/outcome summary clarity"
  - "C08 direct OpenAI Node recipe (after C02 publish)"
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
  - "Suite false-green + CJS context identity are release-gate blockers for verification trust"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  LAST_PUBLISHED_RELEASE: 6.31.8
  ACTIVE: suite-context-trust-after-6318
  NEXT: review C01+C02 → patch publish → C05
  V7_DECISION: NO-GO
  EVIDENCE_GATE: not approved
  ADOPTION_FREEZE: excluded
updatedAt: "2026-09-27"
```
