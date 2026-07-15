# Add local OpenTelemetry Collector round-trip recipe

**Contribution lane:** examples / standards
**Difficulty:** advanced
**Ownership:** community-owned
**Priority:** p1
**Support level:** preview
**Milestone:** Standards Evidence
**Labels:** `examples`, `testing`, `area:standards`, `integration:otel`, `community-owned`, `status:ready`, `difficulty:advanced`, `priority:p1`, `support:preview`

## Problem

External Collector/Phoenix verification is still pending; there is no optional local-only Collector round-trip recipe with pinned versions and known losses.

## Why it matters

Phoenix import recipes do not substitute for a local Collector path; evidence docs still list Collector pending.

## Proposed scope

- Add an optional local-only Collector configuration and synthetic round-trip recipe.
- Export from AgentInspect, pass through a locally owned Collector, inspect resulting evidence, and document known losses.
- No external vendor endpoint.

## Out of scope

- Default network upload
- Collector dependency in root
- Universal compatibility claims
- Production deployment guidance

## Suggested files

- `examples/recipes/` (new optional recipe)
- Local `otel-collector-config.yaml` (synthetic)
- `docs/STANDARDS.md` / `docs/NETWORK-BEHAVIOR.md` links
- Recipe skip notes when Collector unavailable

## Acceptance criteria

- [ ] Local-only configuration
- [ ] Synthetic trace
- [ ] Exact tested Collector version documented
- [ ] Known losses documented
- [ ] Recipe can be skipped when the Collector is unavailable
- [ ] `pnpm recipes:check` still passes when skipped

## Validation commands

```bash
pnpm recipes:check
pnpm docs:check
pnpm typecheck
```

## Privacy / network notes

Collector must be local/customer-owned. No default upload to vendor backends.

## Contributor instructions

Make Collector optional. Document exact binary/version tested.

## Maintainer-review boundary

Do not add Collector as a root/runtime dependency.

