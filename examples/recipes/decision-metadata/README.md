# Recipe: decision-metadata

Record **which** decision an agent made and **under what configuration**,
without recording chain-of-thought, raw prompts, or model reasoning.

Agent runs often need decision context for debugging routing and policy bugs:
which policy version was live, which feature flags were on, which route was
chosen and why (as a bounded reason code). This recipe shows that context as
structured metadata on `run_started` and step metadata, using the correlation
fields (`decisionId`, `groupId`) from [docs/SCHEMA.md](../../../docs/SCHEMA.md).

## Run it

From the repository root:

```bash
pnpm install
pnpm --filter agent-inspect-recipe-decision-metadata start
```

Then inspect locally:

```bash
npx agent-inspect list --dir examples/recipes/decision-metadata/.agent-inspect-runs
npx agent-inspect view <run_id> --dir examples/recipes/decision-metadata/.agent-inspect-runs
npx agent-inspect report <run_id> --dir examples/recipes/decision-metadata/.agent-inspect-runs
```

## Safe fields vs fields to avoid

| Safe to record | Avoid recording |
| -------------- | --------------- |
| `decisionId`, `groupId` correlation ids | chain-of-thought or reasoning text |
| `policyVersion`, config/flag snapshots | raw prompts or model outputs (opt-in only) |
| `candidateRoutes`, `routeChosen` | user content or PII |
| bounded `routeReasonCode` strings | free-form "why" explanations from the model |
| bounded numeric signals (`queueDepth`) | full request/response payloads |

The run metadata in this recipe is deterministic and fake: identifiers,
versions, flags, and scores only. Manual metadata is redacted before disk by
default for common sensitive keys, but redaction is a safeguard, not DLP:
review artifacts before sharing per
[SAFE-TRACE-SHARING.md](../../../docs/SAFE-TRACE-SHARING.md).

## What the trace shows

- `run_started` carries `decisionId`, `groupId`, `policyVersion`, and
  `featureFlags`, so `list`/`search` can correlate runs by decision.
- `choose-route` records the candidate routes and policy version it decided
  under; `tool:resolve-ticket` records the chosen route and a reason code.
- `report <run_id> --attributes` includes the bounded metadata in the local
  report without any reasoning text.

## Related

- [multi-agent-handoff](../multi-agent-handoff) for session/group correlation
- [what-report-inspect](../what-report-inspect) for the inspect flow
- [SAFE-TRACE-SHARING.md](../../../docs/SAFE-TRACE-SHARING.md) before posting artifacts
