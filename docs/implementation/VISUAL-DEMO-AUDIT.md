# Visual demo audit (2026-06-23)

Private implementation artifact for the visual-documentation pass. **Not** user-facing.

**Staging directory:** `/Users/dand/Downloads/output-staging/`  
**Final assets:** `docs/assets/demos/`  
**Repository version at audit:** `1.4.0` (`main`, commit `a281b1f`)

## Phase 0 repository audit

| Item | Finding |
| ---- | ------- |
| Package version | `1.4.0` |
| Prior visual docs | `docs/SCREENSHOTS.md` was a planned checklist only — no committed GIFs/PNGs |
| Asset directories | None before this pass; created `docs/assets/demos/` |
| README images | None |
| Recording workflow | None (no VHS, asciinema, or terminalizer in repo) |
| npm tarball GIFs | `package.json` `files` does not include `docs/assets/` — GIFs excluded from npm |
| Uncommitted work | Clean tree at audit start |

## Media tooling

`ffprobe`, `ffmpeg`, `gifsicle`, `identify`, `magick`, and `vhs` were **unavailable** in the audit environment. Inventory used file size, GIF header dimensions (1200×700), and mandated rejection rules from staging review.

## Source inventory (35 GIFs)

Missing sequence numbers: **none** (01–35 present).

| # | Filename | Size | WxH | Outcome | Placement / notes |
| - | -------- | ---- | --- | ------- | ----------------- |
| 01 | `01-quickstart-basic.gif` | 56 KB | 1200×700 | **Approved** | `quickstart.gif` → gallery, `00-quickstart-demo` README |
| 02 | `02-nested-tree.gif` | 65 KB | 1200×700 | **Approved** | `execution-tree.gif` → **README** hero, gallery, `02-nested-steps` README |
| 03 | `03-parallel-fixtures.gif` | 69 KB | 1200×700 | **Approved** | `parallel-execution.gif` → `03-parallel-steps` README |
| 04 | `04-error-handling.gif` | 73 KB | 1200×700 | **Approved** | `error-handling.gif` → gallery, `04-error-handling` README |
| 05 | `05-observe-wrapper.gif` | 65 KB | 1200×700 | **Approved** | `observe-wrapper.gif` → `05-observe-wrapper` README, API cross-link |
| 06 | `06-maybe-toggle.gif` | 162 KB | 1200×700 | **Approved** | `env-gated-tracing.gif` → gallery |
| 07 | `07-correlation-metadata.gif` | 119 KB | 1200×700 | **Reject (static)** | Use prose in `docs/API.md`; no GIF |
| 08 | `08-redaction-default.gif` | 112 KB | 1200×700 | **Approved** | `redaction.gif` → gallery, `SAFE-TRACE-SHARING.md` |
| 09 | `09-redaction-profiles.gif` | 395 KB | 1200×700 | **Reject** | Too long/large; duplicate of 08; use 08 + prose for profiles |
| 10 | `10-size-bounds.gif` | 136 KB | 1200×700 | **Reject (static)** | Describe in `LIMITATIONS.md` prose |
| 11 | `11-langchain-persist.gif` | 89 KB | 1200×700 | **Approved** | `langchain-persistence.gif` → gallery, `ADAPTERS.md` |
| 12 | `12-langchain-stream.gif` | 89 KB | 1200×700 | **Reject** | `chunkCount` / `streamDurationMs` displayed null |
| 13 | `13-list-filters.gif` | 204 KB | 1200×700 | **Reject** | Visible shell comment errors |
| 14 | `14-view-modes.gif` | 503 KB | 1200×700 | **Reject** | Personal/internal filesystem paths — never commit |
| 15 | `15-view-tui.gif` | 126 KB | 1200×700 | **Approved** | `tui-viewer.gif` → gallery, `ADAPTERS.md` (optional) |
| 16 | `16-logs-json.gif` | 208 KB | 1200×700 | **Re-record** | Tool/LLM summary counts contradict events → `logs-to-tree.gif` pending |
| 17 | `17-logs-log4js.gif` | 213 KB | 1200×700 | **Re-record** | Summary count mismatch → `log4js-ingest.gif` pending |
| 18 | `18-tail-live.gif` | 187 KB | 1200×700 | **Re-record** | Summary count mismatch → `live-tail.gif` pending |
| 19 | `19-export-markdown.gif` | 144 KB | 1200×700 | **Approved** | `markdown-export.gif` → gallery, `EXPORTS.md` |
| 20 | `20-export-html.gif` | 99 KB | 1200×700 | **Re-record** | Shows file creation only, not rendered HTML |
| 21 | `21-export-openinference.gif` | 340 KB | 1200×700 | **Reject (static)** | Prose + fixture sample in `EXPORTS.md` |
| 22 | `22-export-otlp.gif` | 107 KB | 1200×700 | **Reject (prose)** | OTLP compatibility note only |
| 23 | `23-diff-status.gif` | 166 KB | 1200×700 | **Approved** | `diff-runs.gif` — consolidated diff demo |
| 24 | `24-diff-timing.gif` | 127 KB | 1200×700 | **Consolidated** | Merged into `diff-runs.gif` (23) |
| 25 | `25-diff-structure.gif` | 126 KB | 1200×700 | **Consolidated** | Merged into `diff-runs.gif` (23) |
| 26 | `26-timeline-basic.gif` | 89 KB | 1200×700 | **Consolidated** | Superseded by 27 (`--focus slow`) |
| 27 | `27-timeline-slow.gif` | 94 KB | 1200×700 | **Approved** | `timeline.gif` → **README**, gallery, `CLI.md` |
| 28 | `28-stats-directory.gif` | 127 KB | 1200×700 | **Approved** | `stats.gif` — sole stats GIF |
| 29 | `29-stats-correlation.gif` | 135 KB | 1200×700 | **Consolidated** | Prose in `CLI.md` / gallery for `--correlation-id` |
| 30 | `30-stats-group.gif` | 129 KB | 1200×700 | **Consolidated** | Prose in `CLI.md` for `--group-id` |
| 31 | `31-search-status-error.gif` | 70 KB | 1200×700 | **Approved** | `search.gif` → `CLI.md` |
| 32 | `32-search-tool.gif` | 78 KB | 1200×700 | **Reject** | Duplicate of 31 scope; one search demo sufficient |
| 33 | `33-search-duration.gif` | 131 KB | 1200×700 | **Reject** | Duplicate; document `--duration` in prose |
| 34 | `34-clean-dry-run.gif` | 99 KB | 1200×700 | **Reject** | Out of gallery scope; CLI prose sufficient |
| 35 | `35-v0.2-converters.gif` | 77 KB | 1200×700 | **Reject** | Experimental foundation; architecture prose only |

## Summary counts

| Metric | Count |
| ------ | ----- |
| Source GIFs discovered | 35 |
| Missing sequence numbers | 0 |
| Approved & committed | 14 |
| Re-record required (not committed) | 6 |
| Consolidated (not committed separately) | 7 |
| Rejected | 13 |
| Converted to static screenshots | 0 |

## Sensitive-data findings

| Asset | Finding |
| ----- | ------- |
| `14-view-modes.gif` | **Critical** — exposes personal/internal filesystem and identity paths. **Never commit.** |
| All others in staging | No automated text scan (GIF pixels); committed set chosen from low-risk fixture/example flows only |

## Incorrect-output findings

| Asset | Issue |
| ----- | ----- |
| `12-langchain-stream.gif` | Null streaming metadata |
| `13-list-filters.gif` | Shell comment errors |
| `16-logs-json.gif`, `17-logs-log4js.gif`, `18-tail-live.gif` | Summary count contradictions |
| `20-export-html.gif` | File-write only, not rendered HTML |

## Final placement matrix

| Asset | README | SCREENSHOTS | Example README | Feature doc |
| ----- | ------ | ----------- | -------------- | ----------- |
| `execution-tree.gif` | Yes (GitHub raw URL) | Yes | `02-nested-steps` | — |
| `timeline.gif` | Yes (GitHub raw URL) | Yes | — | `CLI.md` |
| `logs-to-tree.gif` | Pending re-record | Linked as pending | `06-log-to-tree` | `LOGS.md` |
| `quickstart.gif` | Link only | Yes | `00-quickstart-demo` | `GETTING-STARTED.md` |
| `error-handling.gif` | — | Yes | `04-error-handling` | — |
| `env-gated-tracing.gif` | — | Yes | — | `GETTING-STARTED.md` |
| `redaction.gif` | — | Yes | — | `SAFE-TRACE-SHARING.md` |
| `langchain-persistence.gif` | — | Yes | `08-langchain-adapter` | `ADAPTERS.md` |
| `tui-viewer.gif` | — | Yes | — | `ADAPTERS.md` |
| `markdown-export.gif` | — | Yes | — | `EXPORTS.md` |
| `diff-runs.gif` | — | Yes | — | `DIFF.md` |
| `stats.gif` | — | Yes | — | `CLI.md` |
| `search.gif` | — | Yes | — | `CLI.md` |
| `parallel-execution.gif` | — | Yes | `03-parallel-steps` | — |
| `observe-wrapper.gif` | — | Yes | `05-observe-wrapper` | `API.md` (link) |

## Conflicting uncommitted work

None at audit start.
