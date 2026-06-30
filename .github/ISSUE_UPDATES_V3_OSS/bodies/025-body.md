# Add Phoenix/OpenInference import graduation guide

**Labels:** `documentation`, `exports`, `standards`, `help wanted`

**Difficulty:** Intermediate

**Milestone:** Standards and Graduation

## Problem

v3 ships OpenInference import paths and fixtures (`fixtures/traces-v1.0/otel-openinference-import.jsonl`, `runtime-and-ingestion` recipe), but there is no **graduation guide** for teams moving from local AgentInspect export → review → optional Phoenix import (clearly marked, no certification claims).

## Why it matters

Standards-oriented teams want a documented local-first workflow before any external tool — not an implicit upload pipeline.

## Proposed scope

- Add or extend docs (e.g. `docs/OPENINFERENCE-GRADUATION.md` or section in `docs/EXPORTS.md`) covering: local export → redact/review → optional import steps.
- Reference existing fixtures and `agent-inspect export` / `open` commands.
- Mark Phoenix import as **optional, user-operated, unverified** unless maintainer confirms steps.
- Cross-link [SAFE-TRACE-SHARING.md](../../docs/SAFE-TRACE-SHARING.md).

## Out of scope

- Vendor certification or guaranteed Phoenix compatibility.
- Network upload from AgentInspect core.
- Changing export runtime defaults.

## Suggested files

- `docs/EXPORTS.md` or new graduation doc
- `examples/recipes/runtime-and-ingestion/` (cross-link only unless gap found)
- `fixtures/traces-v1.0/README.md`

## Acceptance criteria

- [ ] Local export and review steps documented first
- [ ] No default upload behavior implied
- [ ] Synthetic fixture paths referenced
- [ ] Experimental wording preserved

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
```

## Notes for contributors

- Comment before opening a PR.
- Verify any Phoenix steps against public docs; mark unverified sections clearly.
