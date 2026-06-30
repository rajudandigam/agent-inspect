# Case study template

Copy this outline for a design partner or early adopter write-up.

## Summary

- **Company / project:**
- **Stack:** (e.g. AI SDK + Next.js, OpenAI Agents, LangChain)
- **Problem before AgentInspect:**
- **Outcome after adoption:**

## Context

- Team size, deployment model (local dev / CI / staging)
- What was failing or slow in debugging

## Before

- How runs were debugged (logs, hosted traces, etc.)
- Pain points (time to root-cause, CI blind spots, sharing traces)

## Adoption path

1. Install / `init` / starter used
2. First trace (how long, blockers)
3. First `check` or `eval` in CI
4. First `redact` + share workflow

## Results (qualitative or quantitative)

- Time to diagnose incidents
- CI gates added
- Incidents caught before production

## Quotes

> ""

## Technical notes

- Trace directory layout
- Framework adapter mode
- Scale (runs/day, events/run) — see [SCALE-LIMITS.md](./SCALE-LIMITS.md)

## What's next

- Remaining gaps
- Willingness to be a public reference?
