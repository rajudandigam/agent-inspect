# Add OpenInference export fixture

## Problem

OpenInference export is experimental with limited fixture-backed validation in docs and tests.

## Why it matters

Fixture-backed exports help contributors verify compatibility-oriented JSON without claiming vendor certification.

## Proposed scope

- Add fixture trace under `fixtures/traces/` suitable for OpenInference export.
- Add golden snapshot or conformance test in `exporters/openinference-exporter.test.ts`.
- Document sample export command in `docs/EXPORTS.md`.

## Out of scope

- Phoenix/Arize upload integration.
- Declaring OpenInference export stable.

## Acceptance criteria

- [ ] `pnpm fixtures:check` passes
- [ ] Export test asserts key span fields present
- [ ] `docs/EXPORTS.md` references fixture path
- [ ] Experimental label preserved

## Suggested files

- `fixtures/traces/` (new or extend existing)
- `packages/core/test/exporters/openinference-exporter.test.ts`
- `packages/core/test/conformance/exporters.conformance.test.ts`
- `docs/EXPORTS.md`
- `fixtures/README.md`

## Tests to add

- Primary deliverable — fixture + export assertion

## Labels

`good first issue`, `fixtures`, `documentation`

## Difficulty

**Good first issue**
