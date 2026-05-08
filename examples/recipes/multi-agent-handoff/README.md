# Recipe: multi-agent-handoff

## What this demonstrates

A **coordinator** step that plans work, **two specialist** steps (hotel / flight) with explicit **metadata** for handoff targets, then a **finalize** step. No multi-agent framework—just nested `step()` calls.

## Why this matters

Multi-agent products often blur boundaries. Explicit step names + metadata make **who did what** visible in `agent-inspect view` without timestamp-only nesting tricks.

## How to run

```bash
pnpm build
cd examples/recipes/multi-agent-handoff
pnpm install
pnpm start
```

## Expected output

See `expected-output.txt`.

## What to look for

- Nested tree: `orchestrate` → children including `coordinator-plan`, `HotelAgent.run`, `FlightAgent.run`, `coordinator-finalize`.
- Metadata keys like `handoffTarget` on specialist steps (inspect with `--verbose` where supported).

## Notes and limitations

- Not LangGraph / AutoGen—only illustrates AgentInspect boundaries.
- Specialist “agents” are synchronous mocks.

## Version ownership

v0.9 adoption hardening (recipes pass 2).
