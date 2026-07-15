# Add MCP protocol-state fixture corpus

**Contribution lane:** fixtures / mcp
**Difficulty:** intermediate
**Ownership:** community-owned
**Priority:** p1
**Support level:** supported
**Milestone:** Standards Evidence
**Labels:** `fixtures`, `testing`, `area:mcp`, `integration:mcp`, `community-owned`, `status:ready`, `difficulty:intermediate`, `priority:p1`, `support:supported`

## Problem

MCP privacy/adversarial fixtures (#110 closed) do not cover distinguishable protocol-state cases needed for classification evidence.

## Why it matters

Protocol error vs tool error vs cancellation vs progress vs approval vs transport vs normal completion must be distinguishable in traces without leaking sensitive payloads.

## Proposed scope

- Add synthetic fixtures distinguishing:
  protocol error, tool error, cancellation, progress, approval, transport event, normal tool completion.
- Assert current trace classification and privacy boundaries.

## Out of scope

- New MCP transport
- MCP gateway behavior
- Real server traffic
- Sensitive payloads
- Recreating #110 privacy tests

## Suggested files

- `packages/mcp/test/`
- `fixtures/` MCP protocol-state fixtures
- `examples/recipes/mcp-client-tracing/` (optional cross-link)
- `packages/mcp-server/` only if needed for synthetic local peers

## Acceptance criteria

- [ ] Cases are distinguishable
- [ ] No secrets
- [ ] Existing MCP contracts remain unchanged unless a bug is separately approved

## Validation commands

```bash
pnpm test
pnpm fixtures:check
pnpm typecheck
```

## Privacy / network notes

Synthetic local only. Metadata-first. No real credentials.

## Contributor instructions

Coordinate with closed #110 so scopes do not overlap. Prefer fixtures + assertions.

## Maintainer-review boundary

MCP transport/protocol API changes need maintainer ack.

