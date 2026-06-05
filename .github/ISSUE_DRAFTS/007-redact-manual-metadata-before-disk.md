# Redact manual metadata before disk

## Problem

`inspectRun` and `step` can write user-provided `metadata` into JSONL via `run_started` / `step_started`. Log-derived paths use `Redactor`, but manual trace metadata is written as-is.

## Why it matters

Teams may accidentally persist API keys, emails, or tokens in local trace files. Safe-by-default redaction aligns manual traces with log ingest security posture.

## Proposed scope

- Apply `Redactor` (or shared redaction helper) to `options.metadata` and `step` metadata before `writeTraceEvent`.
- Config hook optional: extend `InspectRunOptions` with `redact?: RedactionRule[]` or reuse log ingest rules subset.
- Document in `SECURITY.md` and `docs/SCHEMA.md`.
- Default keys: align with `DEFAULT_REDACT_KEYS` in `logs/redactor.ts`.

## Out of scope

- Redacting user function return values (not captured in MVP traces).
- Uploading redacted traces anywhere.
- Breaking existing traces (additive behavior only).

## Acceptance criteria

- [ ] Known sensitive keys redacted in written JSONL
- [ ] Opt-out or custom rules documented if supported
- [ ] Tests in `security-redaction.test.ts` or new `manual-metadata-redaction.test.ts`
- [ ] `SECURITY.md` updated

## Suggested files

- `packages/core/src/inspect-run.ts`
- `packages/core/src/step.ts`
- `packages/core/src/logs/redactor.ts`
- `packages/core/test/security-redaction.test.ts`
- `SECURITY.md`
- `docs/SCHEMA.md`

## Tests to add

- Metadata with `apiKey` / `password` redacted in trace file
- Nested metadata objects handled

## Labels

`maintainer-owned`, `security`, `enhancement`

## Difficulty

**Maintainer-owned**
