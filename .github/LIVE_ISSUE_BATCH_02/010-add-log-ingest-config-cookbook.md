# Add log ingest config cookbook

**Labels:** `good first issue`, `documentation`, `logging`

**Difficulty:** Good first issue

## Problem

Users need copy-pasteable `LogIngestConfig` JSON examples for common log shapes — run ID keys, nesting, durations, status fields, event mappings, and redaction rules — without reading the entire [docs/LOGS.md](../../docs/LOGS.md) spec first.

## Why it matters

The logging playbook covers framework recipes; a cookbook accelerates adoption for custom JSON loggers and job runners.

## Proposed scope

- Add `docs/LOG-INGEST-COOKBOOK.md` with small JSON config examples for:
  - `requestId` as runId
  - `decisionId` as runId
  - `parentId` nesting
  - `durationMs`
  - `status` mapping
  - Event name mappings (`event`, `type`, custom keys)
  - Redaction rules in ingest config where supported
- Link from [docs/LOGS.md](../../docs/LOGS.md) and [docs/LOGGING-PLAYBOOK.md](../../docs/LOGGING-PLAYBOOK.md).
- Note JSON logs are first-class; log4js remains best-effort.

## Out of scope

- No parser or normalizer code changes.
- No config schema changes.
- No new runtime dependencies.

## Suggested files

- `docs/LOG-INGEST-COOKBOOK.md` (new)
- `docs/LOGS.md` (link)
- `docs/LOGGING-PLAYBOOK.md` (link)

## Acceptance criteria

- [ ] Cookbook contains multiple small, valid JSON config examples
- [ ] Each example includes a one-line description of the log shape it targets
- [ ] Docs explain JSON-first and log4js best-effort boundary
- [ ] Examples use synthetic field names — no customer data

## Validation commands

```bash
pnpm typecheck
pnpm test
```

Optional: verify configs against sample lines if you add matching snippets in `fixtures/logs/`.

## Notes for contributors

- Comment on this issue before opening a PR.
- Cross-check examples against [packages/core/src/logs/config types](../../packages/core/src/logs/) — docs must match current schema.

## Maintainer note

Config schema evolution is maintainer-owned — cookbook documents current behavior only.
