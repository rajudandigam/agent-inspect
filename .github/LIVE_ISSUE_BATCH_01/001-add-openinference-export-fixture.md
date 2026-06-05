# Add OpenInference export fixture

**Labels:** `good first issue`, `fixtures`, `exports`, `testing`

**Difficulty:** Good first issue

## Problem

OpenInference-compatible export is documented as **experimental** and compatibility-oriented, but there is limited fixture-backed validation in docs and tests. Contributors cannot easily verify export shape changes against a canonical trace.

## Why it matters

Fixture-backed exports help teams validate local export JSON without claiming vendor certification or adding upload behavior. This supports the local-first trace workbench story: inspect locally, export when ready, review before sharing.

## Proposed scope

- Add or extend a trace under `fixtures/traces/` suitable for OpenInference export (deterministic, synthetic data only).
- Add or extend tests in `packages/core/test/exporters/openinference-exporter.test.ts` (and optionally `conformance/exporters.conformance.test.ts`) asserting key span/attribute fields.
- Document a sample export command in `docs/EXPORTS.md` pointing at the fixture path.
- Update `fixtures/README.md` if a new trace is added.

## Out of scope

- Phoenix/Arize/Langfuse upload integration or live sink.
- Declaring OpenInference export **stable** (keep experimental wording).
- Changing core export runtime behavior beyond what tests require.

## Suggested files

- `fixtures/traces/` (new or extend existing, e.g. `llm-with-tokens.jsonl`)
- `packages/core/test/exporters/openinference-exporter.test.ts`
- `packages/core/test/conformance/exporters.conformance.test.ts`
- `docs/EXPORTS.md`
- `fixtures/README.md`
- `scripts/validate-fixtures.mjs` (only if new fixture needs validation rules)

## Acceptance criteria

- [ ] `pnpm fixtures:check` passes
- [ ] Export test asserts expected OpenInference-shaped fields for the fixture trace
- [ ] `docs/EXPORTS.md` references the fixture path and sample CLI command
- [ ] Experimental / review-before-sharing labels preserved in docs
- [ ] No real API keys, customer logs, or vendor upload steps

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
```

Optional after build:

```bash
node packages/cli/dist/index.cjs export <run-id> --dir fixtures/traces --format openinference --validate
```

## Notes for contributors

- Read [SECURITY.md](../../SECURITY.md) and [docs/SCHEMA.md](../../docs/SCHEMA.md) before adding fields.
- Comment on this issue before opening a PR.
- Small, focused PRs preferred — fixture + test + doc in one PR is fine.
