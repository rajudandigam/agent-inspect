# Mastra adapter RFC (demand-gated)

**Status:** proposal — **no implementation** in v3.2  
**Related:** [ADAPTER-CONFORMANCE.md](./ADAPTER-CONFORMANCE.md)

## Question

Should AgentInspect ship `@agent-inspect/mastra` as an official adapter?

## Decision (v3.2)

**Defer implementation.** Publish RFC + scorecard only.

## Demand gates (all required)

1. Mastra extension API stable for local-only trace hooks
2. **2+** external users request Mastra support (issues/discussions/design partners)
3. **1** design partner validates metadata-only fixtures end-to-end

## Scorecard

| Criterion | Mastra (v3.2) |
| --------- | ------------- |
| Stable local hook | unknown |
| Metadata-only default | required if built |
| No-network fixtures | not started |
| Conformance runner | not started |
| External demand | not met |

## If approved later

- Optional package `@agent-inspect/mastra`
- Conformance fixtures before docs claim support
- First npm publish → manual gate + Trusted Publisher

## Non-goals

- Broad adapter matrix
- Root Nest/Mastra dependencies
- Hosted observability
