# Current Codex Task

```yaml
train: "v3.5.6"
chunk: "v3.5.6-source-truth-and-v4-planning"
status: "in-progress"
executionMode: "autonomous-release-train"
dependsOn: "3.5.5-published"
```

## Goal

Reset planning for the v4-v7 workspace roadmap and reconcile the v3.5 source of truth (docs only, no publish), then begin v4.0 with the workspace RFC and an internal manifest model — stopping at the first hard stop-gate (new public export / CLI surface / new package).

## Active plan

- Canonical roadmap: [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- Train plan: [release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md](./release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md)
- v4.0 plan: [release-trains/V4.0.0-EXECUTION-PLAN.md](./release-trains/V4.0.0-EXECUTION-PLAN.md)

## Manual gate

- VS Code Marketplace (`packages/vscode`) — deferred.
- First publication of any new public package (e.g. `@agent-inspect/index-sqlite` at v4.1) — manual maintainer gate.
