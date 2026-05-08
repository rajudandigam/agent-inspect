# v1.0 readiness checklist (non-binding)

This checklist prepares for a future **v1.0 Stable Local Agent Inspector** release. **Nothing here declares v1.0 shipped.** It is an internal/adoption checklist only.

## APIs & compatibility

- [x] Public TypeScript APIs reviewed for naming, naming stability, and accidental leakage of internals.
- [x] CLI surface (`agent-inspect …`) reviewed for consistency and backwards-compatible defaults.
- [x] Trace JSONL schema compatibility verified across supported minor versions (additive-only evolution documented).
- [x] Experimental surfaces clearly labeled (exports, optional packages).

## Documentation

- [x] README + architecture docs reflect actual behavior (including limitations).
- [ ] Examples run locally without external services by default.
- [ ] Fixture catalog matches committed fixtures under `fixtures/`.

## Quality gates

- [x] Conformance-style tests cover critical contracts (events, tree rules, redaction, exports, diff).
- [x] Migration/compatibility tests cover legacy traces and log ingest expectations.
- [ ] Integration smoke passes on canonical fixtures.
- [ ] `pnpm fixtures:check` passes after `pnpm build`.
- [ ] Package smoke (`pnpm pack:smoke`) passes.

## Performance & dependencies

- [ ] Performance baseline script reviewed (`pnpm perf:baseline`)—no strict CI thresholds required today.
- [ ] Dependency policy respected ([DEPENDENCY-POLICY.md](./architecture/DEPENDENCY-POLICY.md)); no accidental heavy runtime deps.

## Risk & release hygiene

- [ ] No open P0/P1 defects blocking honest “safe default” claims.
- [ ] Adapter-only packages remain clearly scoped; sink APIs not frozen prematurely.
- [ ] Security posture: redacted-by-default behavior verified for logs + exports.

## Explicit non-goals (still)

- Declaring **finished v1.0** requires a separate release decision and changelog—not this document alone.
