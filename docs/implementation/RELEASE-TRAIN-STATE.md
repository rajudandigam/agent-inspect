# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.17.7"
publishedVersion: "6.17.7"
currentTrain: "v6.17.8-closeout-trust"
trainStatus: "in-progress"
executionMode: "maintainer-reviewed"
namedTrain: "agentinspect-feedback-integrity-v6.17.5-to-v6.22"
branch: "main"
currentChunk: "phase0-roadmap-truth"
lastConfirmedCommit: "1b5351c"
lastValidationLevel: "preflight"
nextAction: "Land #340; MCP untrusted-trace; close completed issues; publish 6.17.8"
pendingManualGate: ""
githubIssues:
  "67": "candidate close — doctor troubleshooting (verify vs #296/#337)"
  "164": "candidate close — OTel Collector round-trip (verify vs #303/#337)"
  "165": "candidate close — MCP protocol-state fixtures (verify vs #302/#337)"
  "209": "keep open — cross-platform packed-consumer matrix"
  "213": "keep open — official-adapter no-key lifecycle (6.18)"
  "222": "candidate close — TraceFacts parity (verify vs #294/#337)"
  "308": "6.20 requiredOrderMode — stay open; PR #315"
  "309": "6.20 alternatives.anyOf — stay open"
  "311": "6.18 preview parity — stay open"
  "328": "6.18 residual safety after redact"
  "329": "6.18 bounded CLI redaction policy"
  "330": "6.18 view --errors-only pruned tree"
  "331": "6.22 — design confirmed; existing APIs only; not implemented"
  "339": "6.17.8 — clean --keep malformed counts; PR #340"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "6.17.7 published (Version Packages #326)"
  - "6.17.8 contributor queue batch (#314/#337/#338)"
remainingTrains:
  - "v6.17.8-closeout-trust (active)"
  - "v6.17.9 conditional — verified security/compat only"
  - "v6.18.0 safe adoption and differentiation"
  - "v6.19.0 external evidence and derived failure semantics"
  - "v6.20.0 flexible deterministic contracts"
  - "v6.21.0 multi-agent evidence precision"
  - "v6.22.0 conditional design-partner recipes"
blockedTrains:
  - "v7.0.0 (conditional — assessment only; not scheduled)"
updatedAt: "2026-09-05"
```
