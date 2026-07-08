# Current Codex Task

```yaml
train: "v4.0.0"
chunk: "v4.0-1-workspace-manifest-model"
status: "complete-stopped-at-gate"
executionMode: "autonomous-release-train"
dependsOn: "3.5.5-published"
```

## Goal

Kick off the v4-v7 workspace roadmap: reset planning (v3.5.6), reconcile the v3.5 source of truth (docs only, no publish), and begin v4.0 with the workspace RFC and an internal manifest model — stopping at the first hard stop-gate.

## Done this pass

- v3.5.6 planning reset + v4-v7 execution plans (commit `06f4453`).
- v3.5.6 source-of-truth reconciliation (commit `09770fc`, no publish).
- v4.0-0 workspace RFC (commit `d5137d1`).
- v4.0-1 internal workspace manifest model + validator + defaults + 20 tests (commit `3f72794`).

## STOP — hard gate (maintainer go-ahead required)

Next chunk **v4.0-2** (workspace filesystem helpers) and **v4.0-3** (workspace CLI) introduce public surface:

- new `agent-inspect/workspace` subpath export (root `package.json` exports, `packages/core/src/entries/`, `tsup.core.config.ts`, API/subpath stability tests), and/or
- new `agent-inspect workspace ...` CLI commands.

These are maintainer-owned per the roadmap stop-gate policy. Do not proceed without explicit authorization.

## Active plan

- Canonical roadmap: [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- v4.0 plan: [release-trains/V4.0.0-EXECUTION-PLAN.md](./release-trains/V4.0.0-EXECUTION-PLAN.md)
- Workspace RFC: [../proposals/LOCAL-TRACE-WORKSPACE.md](../proposals/LOCAL-TRACE-WORKSPACE.md)

## Manual gate

- v4.0 public workspace surface (export + CLI) — maintainer review.
- VS Code Marketplace (`packages/vscode`) — deferred.
- First publication of any new public package (e.g. `@agent-inspect/index-sqlite` at v4.1).
