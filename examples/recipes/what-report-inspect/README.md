# Recipe: what-report-inspect

## What this demonstrates

A **v1.5 inspection workflow** after tracing a small agent run locally:

1. Write a trace with `inspectRun` / `step` (including optional token metadata on an LLM step).
2. Summarize with **`agent-inspect what`** — concise terminal overview.
3. Generate a shareable **`agent-inspect report`** — markdown or HTML combining what, timeline, and execution tree.

## Why this matters

`what` answers “what happened?” in a few lines; `report` produces a fuller local artifact for PRs, postmortems, or CI downloads — without a hosted observability platform.

## How to run locally

From the repository root:

```bash
pnpm build
cd examples/recipes/what-report-inspect
pnpm install
pnpm start
```

Then run the printed CLI commands. Run ids are generated (`run_xxx`), so copy the `Run id:` the recipe prints:

```bash
npx agent-inspect what <run-id> --dir ./.agent-inspect-runs
npx agent-inspect report <run-id> --dir ./.agent-inspect-runs --format markdown
npx agent-inspect report <run-id> --dir ./.agent-inspect-runs \
  --format html --redaction-profile share -o ./report.html
```

## CI pattern

Pair with [github-actions-artifact](../github-actions-artifact/README.md): upload `report.html` or markdown alongside raw JSONL. See [docs/CI-ARTIFACTS.md](../../../docs/CI-ARTIFACTS.md).

## Expected output

See `expected-output.txt`.

## Boundaries

- No API keys or external LLM calls
- No vendor upload from AgentInspect
- Token counts are **user-supplied metadata** only — core does not count tokens
- Review reports before sharing (`--redaction-profile share` or `strict` for wider audiences)

## See also

- [TRACE-VOCABULARY-V1.5.md](../../../docs/proposals/TRACE-VOCABULARY-V1.5.md)
- [CLI.md](../../../docs/CLI.md) §6.11–6.12
