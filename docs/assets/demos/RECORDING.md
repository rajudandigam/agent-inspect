# Visual demo recording guide

AgentInspect does **not** ship a committed VHS, asciinema, or terminalizer workflow in this repository. GIFs under `docs/assets/demos/` are curated terminal recordings checked in for documentation only. They are **not** included in the npm package tarball.

Re-record when CLI output changes or when a staged asset fails the acceptance checks in [VISUAL-DEMO-AUDIT.md](../../implementation/VISUAL-DEMO-AUDIT.md).

## Environment

- Repository root, after `pnpm install && pnpm build`
- Terminal width **1200px**, compact height (~700px)
- Font: readable monospace at ~800px rendered width
- Target duration: **6–10s** (README), **≤15s** (docs)
- Hold final frame ~2s
- Crop unused terminal margins
- Target **< 1 MB** per GIF

## Safety checklist (every recording)

- No `/Users/`, `/home/`, personal usernames, emails, company names, or private repo paths
- No API keys, tokens, or production hostnames
- No shell comment lines pasted as commands (no `#` comment errors)
- No `null` metadata unless demonstrating an intentional error state
- Summary counts (Tools / LLMs / Events) must match visible output
- Synthetic fixture IDs only (`fixtures/traces`, `fixtures/logs`, examples)
- No external LLM or network calls

## Recorder

Use any terminal recorder that exports GIF (VHS, asciinema + agg, terminalizer, etc.). **Do not** add recorder dependencies to `package.json`.

## Pending re-records

| Final name | Source issue | Canonical command | Notes |
| ---------- | ------------ | ----------------- | ----- |
| `logs-to-tree.gif` | Staging `16-logs-json.gif` — tool/LLM summary counts contradicted events | `agent-inspect logs fixtures/logs/minimal-success.json.log --format json --run-id-key runId --event-key event --timestamp-key timestamp` | Verify Summary line matches event list |
| `live-tail.gif` | Staging `18-tail-live.gif` — summary count mismatch | `agent-inspect tail fixtures/logs/minimal-success.json.log --format json --run-id-key runId --event-key event --timestamp-key timestamp` | Short deterministic sample; end on stable tree |
| `log4js-ingest.gif` | Staging `17-logs-log4js.gif` — summary count mismatch | `agent-inspect logs examples/recipes/log4js-json-layout/sample-log4js.log --format log4js` | Docs-only; link from [LOGS.md](../../LOGS.md) |
| `export-html.gif` | Staging `20-export-html.gif` — showed file creation only | Export then open rendered HTML in terminal browser preview or split-pane screenshot | Must show **rendered report**, not just `wrote file` |
| `langchain-stream.gif` | Staging `12-langchain-stream.gif` — `chunkCount` / `streamDurationMs` null | `pnpm --filter agent-inspect-example-08-langchain-adapter start` with streaming fixture | Only publish when metadata is non-null |
| `list-filters.gif` | Staging `13-list-filters.gif` — shell comment errors visible | `agent-inspect list --dir fixtures/traces` | Clean commands only |

## Approved asset commands (reference)

| File | Command / flow |
| ---- | -------------- |
| `quickstart.gif` | `examples/00-quickstart-demo`: install → `npm start` → `list` → `view` |
| `execution-tree.gif` | `examples/02-nested-steps`: `pnpm start` → `view` nested tree |
| `parallel-execution.gif` | `examples/03-parallel-steps`: `pnpm start` → `view` parallel siblings |
| `error-handling.gif` | `examples/04-error-handling`: `pnpm start` → `view` failed step |
| `observe-wrapper.gif` | `examples/05-observe-wrapper`: `pnpm start` → `view` |
| `env-gated-tracing.gif` | Toggle `AGENT_INSPECT=1` with `maybeInspectRun` example |
| `redaction.gif` | `inspectRun` with sensitive metadata keys → `view` shows `[REDACTED]` |
| `langchain-persistence.gif` | `examples/08-langchain-adapter` with `persist: true` → `list` / `view` |
| `tui-viewer.gif` | `agent-inspect view <fixture-run> --dir fixtures/traces --tui` (optional package) |
| `markdown-export.gif` | `agent-inspect export minimal-success --dir fixtures/traces --format markdown` |
| `diff-runs.gif` | `agent-inspect diff minimal-success minimal-error --dir fixtures/traces` |
| `timeline.gif` | `agent-inspect timeline long-running --dir fixtures/traces --focus slow` |
| `stats.gif` | `agent-inspect stats --dir fixtures/traces` |
| `search.gif` | `agent-inspect search --dir fixtures/traces --status error --limit 5` |

## Placement

See [SCREENSHOTS.md](../../SCREENSHOTS.md) for where each committed asset is referenced.
