# Improve diff CLI output examples

## Problem

`agent-inspect diff` behavior is documented briefly; newcomers lack sample terminal output showing step renames, duration ignores, and error diffs.

## Why it matters

Clear CLI examples improve adoption for prompt/model change debugging workflows.

## Proposed scope

- Add example output blocks to `docs/DIFF.md` using `fixtures/traces/minimal-success` vs `minimal-error`.
- Optional: add `--help` examples in `docs/CLI.md`.
- Use "Simplified example output" labeling where formatting may vary.

## Out of scope

- Semantic / LLM-powered diff.
- Changing diff engine behavior.

## Acceptance criteria

- [ ] At least two sample diff outputs in docs
- [ ] Commands copy-pasteable with `fixtures/traces` paths
- [ ] Links from `README.md` Real-world workflows (optional)

## Suggested files

- `docs/DIFF.md`
- `docs/CLI.md`
- `README.md` (optional)

## Tests to add

- None required (docs). Optional snapshot test if CLI output stabilized.

## Labels

`good first issue`, `documentation`, `cli`

## Difficulty

**Good first issue**
