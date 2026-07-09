# GitHub artifact fixture

Checked-in sample artifact used by `@agent-inspect/studio` GitHub import tests.

- `sample-artifact.zip` — minimal zip archive (no live GitHub API in CI)
- `sample.jsonl` — source file inside the zip

Tests mock `fetch` and serve this zip bytes as the artifact download response.
