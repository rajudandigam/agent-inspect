# Shareable trace bundles

AgentInspect **bundles** are local, offline folders you can attach to PRs, incident threads, or internal reviews. They combine redacted trace copies, HTML reports, safety check results, and a human summary — without mutating source traces or calling the network.

Evidence v2 (6.10+) adds `evidence.html` + `evidence.json` (hashed integrity) on top of the existing layout. See [EVIDENCE-FORMAT.md](./EVIDENCE-FORMAT.md).

## Quick start

```bash
# Single run (default share profile + automatic verify-safe)
npx agent-inspect bundle <runId> --dir ./.agent-inspect

# Session or time window
npx agent-inspect bundle --session <sessionId> --dir ./.agent-inspect
npx agent-inspect bundle --since 24h --profile strict --dir ./.agent-inspect

# Explicit output folder (directory mode strips a bare .zip suffix)
npx agent-inspect bundle <runId> --out ./my-bundle --json

# Formats
npx agent-inspect bundle <runId> --format directory --out ./my-bundle
npx agent-inspect bundle <runId> --format html --out ./evidence-html
npx agent-inspect bundle <runId> --format zip --out ./my-bundle.zip

# Integrity check (Evidence v2 directory)
npx agent-inspect bundle verify ./my-bundle
```

When a workspace exists, default output goes under `.agent-inspect/bundles/`.

## Bundle layout

```text
evidence.html              # offline Evidence v2 report (primary review surface)
evidence.json              # Evidence v2 manifest + SHA-256 file hashes
trace.html                 # offline HTML (index for multi-run)
trace.jsonl                # redacted JSONL copy
summary.md                 # human overview
metadata.json              # legacy manifest (version, profile, safe status)
check-results.json         # verify-safe / check results per run (may include contract digest binding)
contract.resolved.json     # optional resolved TraceContract / preset snapshot (6.28+)
redaction-report.json      # detector summary (no secret values)
eval-results.json          # placeholder unless eval artifacts are added later
performance-summary.json   # placeholder unless perf artifacts are added later
assets/runs/<safeRunId>.*  # per-run HTML + JSONL mirrors (safe filenames)
```

## Safety defaults

| Setting | Default |
| ------- | ------- |
| Redaction profile | `share` |
| verify-safe | Runs automatically on the **redacted artifact** before write |
| UNSAFE / UNKNOWN artifact | Command fails unless `--allow-unsafe` |
| Source traces | Read-only; never modified |

Profiles:

- **`share`** — PR / internal support (default)
- **`strict`** — external or public sharing
- **`local`** — minimal redaction for local archives only

## When to use bundles vs other commands

| Need | Command |
| ---- | ------- |
| One redacted file | `redact` |
| Safety scan only | `verify-safe` / `scan` |
| CI artifact set (+ evidence on failure) | `artifacts` |
| PR-ready evidence folder | **`bundle`** |
| Integrity check | **`bundle verify`** |

## Review before sharing

Bundles are **derived copies**, not compliance certification. Always review `evidence.html` / `summary.md`, `check-results.json`, and run `bundle verify` before attaching to tickets or PRs.

When `contract.resolved.json` is present (6.28+), reviewers can inspect the resolved TraceContract or check preset that was evaluated and confirm digests via `bundle verify`. Custom/programmatic rules are marked `partial` and are not fully replayable from JSON. Contract binding is **not** a signature or trusted-time claim — see [EVIDENCE-FORMAT.md](./EVIDENCE-FORMAT.md#contract-binding-628).

See also [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) and [CLI.md §6.24](./CLI.md#624-bundle).

## Review workflow

```text
capture → check → redact → verify-safe → bundle → bundle verify → attach to PR/incident
```

Broken vs fixed demo fixtures: [`fixtures/evidence/demo/`](../fixtures/evidence/demo/).

## RFC

- Shareable bundles (v4.3): [proposals/SHAREABLE-BUNDLES-V4.3.md](./proposals/SHAREABLE-BUNDLES-V4.3.md)
- Portable Evidence v2: [EVIDENCE-FORMAT.md](./EVIDENCE-FORMAT.md)
