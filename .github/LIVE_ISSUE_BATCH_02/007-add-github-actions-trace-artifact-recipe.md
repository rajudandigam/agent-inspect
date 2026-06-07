# Add GitHub Actions trace artifact recipe

**Labels:** `examples`, `testing`, `roadmap-next`

**Difficulty:** Intermediate

## Problem

Teams want to attach AgentInspect trace output as CI artifacts without adopting a hosted observability platform. There is no documented example workflow showing `AGENT_INSPECT=1`, trace directories, and artifact upload.

## Why it matters

CI trace artifacts support local-first debugging in PR pipelines — aligned with ROADMAP Next (~v1.4.0 Vitest reporter direction) but achievable today with docs and YAML only.

## Proposed scope

- Add `docs/CI-ARTIFACTS.md` covering:
  - Running tests or scripts with `AGENT_INSPECT=1` / `maybeInspectRun`
  - Uploading `.agent-inspect/` JSONL traces as workflow artifacts
  - Optional Markdown export upload for human review
  - Redaction reminder before artifacts become public
- Add `examples/recipes/github-actions-artifact/` with:
  - `README.md`
  - Sample workflow YAML (`.github/workflows/` example file in recipe folder, not necessarily wired into repo CI)
  - Minimal script demonstrating trace generation in CI

## Out of scope

- No `@agent-inspect/vitest` or `@agent-inspect/jest` package.
- No PR bot or automatic comment bot.
- No vendor telemetry upload.
- No changes to repo's production CI unless maintainer explicitly requests (example YAML can live in recipe folder).

## Suggested files

- `docs/CI-ARTIFACTS.md` (new)
- `examples/recipes/github-actions-artifact/` (new)
- Link from [CONTRIBUTING.md](../../CONTRIBUTING.md) or [docs/GETTING-STARTED.md](../../docs/GETTING-STARTED.md)

## Acceptance criteria

- [ ] Docs clearly state the workflow is an **example**, not a guaranteed supported integration
- [ ] No new runtime code in `packages/`
- [ ] No secret data in example YAML or traces
- [ ] `pnpm recipes:check` passes if recipe folder is registered

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm recipes:check
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Use synthetic trace data only.
- GitHub Actions artifact upload is the only “upload” shown — local-first boundary must remain clear.

## Maintainer note

Vitest reporter implementation remains a separate proposal ([ISSUE_DRAFTS/018](../../.github/ISSUE_DRAFTS/018-add-vitest-reporter-proposal.md)).
