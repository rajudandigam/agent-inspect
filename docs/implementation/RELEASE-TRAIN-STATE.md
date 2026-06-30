# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.0.0"
publishedVersion: "3.0.0"
currentTrain: "v3.1.0"
trainStatus: "active"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v3.0-publication-complete"
  - "v3.1-0-planning-reset"
  - "v3.1-1-make-harness-public"
  - "v3.1-2-implement-agent-inspect-init"
  - "v3.1-3-implement-agent-inspect-doctor"
  - "v3.1-4-add-starter-templates"
  - "v3.1-5-readme-onboarding-update"
  - "v3.1-6-v3.1-release-readiness"
currentChunk: "v3.1-release-prep"
nextAction: "Push commits; publish @agent-inspect/harness; Version Packages PR for 3.1.0."
pendingManualGate: ""
lastConfirmedCommit: "f6a6bfe"
lastValidationLevel: "v3.1-6-v3.1-release-readiness"
updatedAt: "2026-06-29"
```

- **Active roadmap:** [ROADMAP-V3.0-TO-V3.5.md](./ROADMAP-V3.0-TO-V3.5.md)
- **Architecture guide (historical):** [V2-TO-V3-ARCHITECTURE-GUIDE.md](./V2-TO-V3-ARCHITECTURE-GUIDE.md)
- **Active plan:** [release-trains/V3.1.0-EXECUTION-PLAN.md](./release-trains/V3.1.0-EXECUTION-PLAN.md)
- **Latest readiness:** [release-trains/V3.1.0-RELEASE-READINESS.md](./release-trains/V3.1.0-RELEASE-READINESS.md)
- **Historical v3 contracts:** [V3-EXTENSION-CONTRACTS.md](../proposals/V3-EXTENSION-CONTRACTS.md)
