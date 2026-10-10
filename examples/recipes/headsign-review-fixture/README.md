# Recipe: headsign-review-fixture (meganemura / W13)

Docs-only / synthetic review fixture for [meganemura/headsign](https://github.com/meganemura/headsign).
Pinned against the documented `headsign next` first-line tokens and
`headsign status` exit-code rules (workflow-reference / historical CLI contract).

Transcripts are **labeled synthetic** — not produced by an actual CLI run.
This recipe never executes commands copied from a record.

Not a runtime dependency or full integration.

## Run

```bash
pnpm --filter agent-inspect-recipe-headsign-review-fixture start
```
