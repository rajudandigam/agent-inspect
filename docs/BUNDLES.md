# Shareable trace bundles

AgentInspect **bundles** are local, offline folders you can attach to PRs, incident threads, or internal reviews. They combine redacted trace copies, HTML reports, safety check results, and a human summary — without mutating source traces or calling the network.

## Quick start

```bash
# Single run (default share profile + automatic verify-safe)
npx agent-inspect bundle <runId> --dir ./.agent-inspect

# Session or time window
npx agent-inspect bundle --session <sessionId> --dir ./.agent-inspect
npx agent-inspect bundle --since 24h --profile strict --dir ./.agent-inspect

# Explicit output folder (.zip suffix is stripped — folder-first MVP)
npx agent-inspect bundle <runId> --out ./my-bundle --json
```

When a workspace exists, default output goes under `.agent-inspect/bundles/`.

## Bundle layout

```text
trace.html                 # offline HTML (index for multi-run)
trace.jsonl                # redacted JSONL copy
summary.md                 # human overview
metadata.json              # manifest (version, profile, safe status)
check-results.json         # verify-safe results per run
redaction-report.json      # detector summary (no secret values)
eval-results.json          # placeholder unless eval artifacts are added later
performance-summary.json   # placeholder unless perf artifacts are added later
assets/runs/<runId>.*      # per-run HTML + JSONL mirrors
```

## Safety defaults

| Setting | Default |
| ------- | ------- |
| Redaction profile | `share` |
| verify-safe | Runs automatically before write |
| UNSAFE traces | Command fails unless `--allow-unsafe` |
| Source traces | Read-only; never modified |

Profiles:

- **`share`** — PR / internal support (default)
- **`strict`** — external or public sharing
- **`local`** — minimal redaction for local archives only

## When to use bundles vs other commands

| Need | Command |
| ---- | ------- |
| One redacted file | `redact` |
| Safety scan only | `verify-safe` |
| CI artifact set | `artifacts` |
| PR-ready evidence folder | **`bundle`** |

## Review before sharing

Bundles are **derived copies**, not compliance certification. Always review `summary.md`, `check-results.json`, and `trace.html` before attaching to tickets or PRs.

See also [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) and [CLI.md §6.24](./CLI.md#624-bundle).

## RFC

Design details: [proposals/SHAREABLE-BUNDLES-V4.3.md](./proposals/SHAREABLE-BUNDLES-V4.3.md).
