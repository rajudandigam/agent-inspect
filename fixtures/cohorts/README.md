# Cohort fixtures

Baseline/candidate trace sets for `agent-inspect cohort` regression checks.

## `before-after/`

| File | Cohort | Notes |
|------|--------|-------|
| `before-1.jsonl`, `before-2.jsonl` | `before` | `searchDocs` tool, success |
| `after-1.jsonl`, `after-2.jsonl` | `after` | `deleteAccount` tool, run error, failed observation |

Metadata key: `cohort`. Grouping examples use `model` (`gpt-4-mini`) or `metadata.promptVersion` (`v1` / `v2`).

```bash
agent-inspect cohort \
  --dir fixtures/cohorts/before-after \
  --baseline before \
  --candidate after \
  --group-by model
```
