# Current Codex Task

```yaml
train: "v4.2.0"
chunk: "v4.2-0-sessions-activity-rfc"
status: "in_progress"
executionMode: "autonomous-release-train"
dependsOn: "v4.1.0-published (all 17 packages @ 4.1.0)"
```

## Goal

Continue the v4-v7 release train after v4.1.0 publication. Begin v4.2.0 (Sessions and Activity) with the RFC refresh, then implement session status, activity summaries, expanded CLI, and optional index acceleration per [V4.2.0-EXECUTION-PLAN.md](./release-trains/V4.2.0-EXECUTION-PLAN.md).

## Done prior

- v4.0.0 local trace workspace — published.
- v4.1.0 optional local index — all 17 packages published @ 4.1.0 (including manual first publish of `@agent-inspect/index-sqlite` + Trusted Publishing).

## Active plan

- Canonical roadmap: [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- v4.2 plan: [release-trains/V4.2.0-EXECUTION-PLAN.md](./release-trains/V4.2.0-EXECUTION-PLAN.md)
- Sessions RFC: [../proposals/SESSIONS-AND-ACTIVITY-V4.2.md](../proposals/SESSIONS-AND-ACTIVITY-V4.2.md)

## Manual gates

- New core export surface for session APIs (if added) — root export review (v4.2 plan).
- VS Code Marketplace (`packages/vscode`) — deferred.
