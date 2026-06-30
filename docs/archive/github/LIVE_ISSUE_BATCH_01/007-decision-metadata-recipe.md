# Decision metadata recipe

**Labels:** `examples`, `documentation`, `roadmap-next`

**Difficulty:** Intermediate

## Problem

Agent workflows often branch on decisions (route selection, guardrails, human-in-the-loop gates). AgentInspect supports rich step metadata, but there is no **deterministic recipe** showing how to log decision-shaped metadata for local inspection and export review.

## Why it matters

Decision metadata patterns help teams use AgentInspect as a local trace workbench for branching logic — without building a hosted eval platform or replay engine.

## Proposed scope

- Add a runnable recipe under `examples/recipes/` (new folder) demonstrating:
  - Manual `inspectRun` / `step` with decision metadata (e.g. `decision`, `branch`, `confidence`, `reason` fields — synthetic only)
  - Optional structured JSON log lines compatible with `agent-inspect logs`
  - `expected-output.txt` marker for `pnpm recipes:check`
- Document in `examples/recipes/README.md` and link from [docs/LOGGING-PLAYBOOK.md](../../docs/LOGGING-PLAYBOOK.md) or [docs/GETTING-STARTED.md](../../docs/GETTING-STARTED.md).
- No external APIs or API keys.

## Out of scope

- Hosted eval datasets, prompt registries, or SaaS eval platforms.
- Replay / fork from traces.
- Schema changes or new core event types (use existing metadata on `step_completed`).

## Suggested files

- `examples/recipes/decision-metadata/` (new recipe package)
- `examples/recipes/README.md`
- `scripts/validate-recipes.mjs` (register recipe)
- `docs/GETTING-STARTED.md` or `docs/LOGGING-PLAYBOOK.md` (short pointer)

## Acceptance criteria

- [ ] `pnpm recipes:check` passes
- [ ] Recipe runs with `pnpm start` from recipe folder (workspace root install)
- [ ] README explains decision metadata fields and local inspection commands
- [ ] Uses synthetic data only

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm recipes:check
```

## Notes for contributors

- Follow existing recipe patterns (`examples/recipes/retry-fallback`, `multi-agent-handoff`).
- Comment before starting if you want to combine log ingest + manual trace in one recipe.
