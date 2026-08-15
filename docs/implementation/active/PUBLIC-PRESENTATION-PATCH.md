# 6.17.2 public presentation addendum

Named train: `agentinspect-public-presentation-demo-integration-v6.17.1`

This file is an **addendum** to the blocked 6.18 record. Do not treat it as a replacement for [EXECUTION-PLAN.md](./EXECUTION-PLAN.md) or [EXTERNAL-ACCEPTANCE-GATE.md](./EXTERNAL-ACCEPTANCE-GATE.md).

## Scope

- PR A: preset + CLI shorthand select union (already on `fix/preset-shorthand-selection-v6.17.2`)
- PR B: Debug / Prevent / Share presentation, canonical showcase, curated `docs/assets/showcase/`

## Non-goals

No merge/tag/`publish.yml`/local npm publish in this addendum. Optional 6.17.2 Changeset only after tag..HEAD is classified patch-safe.

## Post-tag classification (this train)

`git log agent-inspect@6.17.1..HEAD` includes `f279224` (6.18.0 support-level consolidation / stop before Changeset). That is **not** patch-safe to ship as 6.17.2. Prepare the presentation candidate and **stop before `.changeset/`**.
