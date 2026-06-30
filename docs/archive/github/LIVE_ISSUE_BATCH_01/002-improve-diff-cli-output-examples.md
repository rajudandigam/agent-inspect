# Improve diff CLI output examples

**Labels:** `good first issue`, `documentation`, `cli`, `examples`

**Difficulty:** Good first issue

## Problem

`agent-inspect diff` is documented briefly. New users lack sample terminal output showing step renames, duration-only changes, and error diffs when comparing two local traces.

## Why it matters

Diff is a core local debugging workflow for prompt/model/routing changes. Clear CLI examples improve adoption without adding hosted observability or replay features.

## Proposed scope

- Add example output blocks to `docs/DIFF.md` using `fixtures/traces/minimal-success.jsonl` vs `fixtures/traces/minimal-error.jsonl` (or other canonical pairs).
- Optionally add copy-paste commands to `docs/CLI.md` under the `diff` section.
- Label samples as **"Simplified example output"** where formatting may vary slightly by terminal.
- Optional: one-line link from [README.md](../../README.md) Real-world workflows section.

## Out of scope

- Semantic / LLM-powered diff.
- Changing diff engine behavior or comparability rules.
- New runtime dependencies.

## Suggested files

- `docs/DIFF.md`
- `docs/CLI.md`
- `README.md` (optional cross-link)

## Acceptance criteria

- [ ] At least two sample diff outputs in docs (success vs error, and one additional scenario if easy)
- [ ] Commands are copy-pasteable with `fixtures/traces` paths
- [ ] Docs state diff is read-only and local-only
- [ ] No claim that diff replaces production APM

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm build
node packages/cli/dist/index.cjs diff minimal-success minimal-error --dir fixtures/traces
```

Docs-only PRs: `pnpm typecheck` and `pnpm test` at minimum.

## Notes for contributors

- Capture actual CLI output where possible; trim noise only.
- Do not include secrets or production trace content in examples.
