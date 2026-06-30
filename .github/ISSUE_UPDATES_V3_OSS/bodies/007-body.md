# Add OpenInference export fixture (v3 schema)

**Labels:** `good first issue`, `fixtures`, `exports`, `testing`

**Difficulty:** Good first issue

**Milestone:** Standards and Graduation

## Problem

OpenInference-compatible export is documented as **experimental** and compatibility-oriented. v3 ships import fixtures under `fixtures/traces-v1.0/otel-openinference-import.jsonl`, but contributors still lack a **canonical export round-trip** fixture with fixture-backed tests tied to the current persisted schema (1.0).

## Why it matters

Fixture-backed exports help teams validate local export JSON without vendor upload or certification claims. This supports the local-first trace workbench: inspect locally, export when ready, review before sharing ([SAFE-TRACE-SHARING.md](../../docs/SAFE-TRACE-SHARING.md)).

## Proposed scope

- Add or extend a deterministic trace under `fixtures/traces/` or `fixtures/traces-v1.0/` suitable for OpenInference export (synthetic data only).
- Extend tests in `packages/core/test/exporters/openinference-exporter.test.ts` (and optionally conformance tests) for key span/attribute fields on the current schema.
- Document sample export command in `docs/EXPORTS.md` pointing at the fixture path.
- Update `fixtures/README.md` if a new fixture is added.

## Out of scope

- Phoenix/Arize/Langfuse upload integration.
- Declaring OpenInference export **stable**.
- Changing core export runtime behavior beyond what tests require.

## Suggested files

- `fixtures/traces/` or `fixtures/traces-v1.0/`
- `packages/core/test/exporters/openinference-exporter.test.ts`
- `docs/EXPORTS.md`
- `fixtures/README.md`

## Acceptance criteria

- [ ] `pnpm fixtures:check` passes
- [ ] Export test asserts expected OpenInference-shaped fields for the fixture trace
- [ ] `docs/EXPORTS.md` references fixture path and sample CLI command
- [ ] Experimental / review-before-sharing wording preserved
- [ ] No real API keys or vendor upload steps

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Read [SECURITY.md](../../SECURITY.md) and [docs/SCHEMA.md](../../docs/SCHEMA.md).
- Partial coverage already exists — extend rather than duplicate.
