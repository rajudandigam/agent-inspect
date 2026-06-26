# Recipe: deterministic-ci-checks

## What this demonstrates

A local v1.8 CI workflow for:

1. Writing baseline and candidate fixture traces.
2. Running deterministic checks with explicit rules.
3. Comparing against a baseline through CLI artifact commands.
4. Creating safe local CI artifacts and an optional GitHub step-summary file.
5. Uploading files only through user-owned CI configuration.

## Why this matters

The v1.8 checks and artifact commands let CI fail on local, deterministic evidence without rerunning agents, calling providers, uploading traces, or embedding raw prompt/output/tool payloads in summary artifacts. Version ownership stays explicit: manual trace writing remains `schemaVersion: "0.1"`, while checks consume normalized reader output.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/deterministic-ci-checks
pnpm install
pnpm start
```

Run checks against the generated candidate trace:

```bash
npx agent-inspect check ci-check-fixture --dir ./.agent-inspect-candidate --json
```

Create a safe local artifact bundle with baseline comparison and a step-summary file:

```bash
npx agent-inspect artifacts ci-check-fixture \
  --dir ./.agent-inspect-candidate \
  --baseline ./.agent-inspect-baseline \
  --output-dir ./artifacts \
  --github-summary ./agent-inspect-summary.md
```

## Expected output

See `expected-output.txt`.

## What to look for

- `agent-inspect check` reads local traces and returns deterministic JSON with rule findings and diagnostics.
- `agent-inspect artifacts` writes only to `--output-dir` and the optional `--github-summary` path.
- Baseline comparison is explicit: the candidate and baseline inputs are passed separately.
- Evidence points at run/event identifiers and paths instead of raw prompts, outputs, headers, request bodies, or full tool payloads.

## Notes and limitations

- The workflow example is local-first. GitHub artifact upload, when used, is ordinary user-owned CI YAML; AgentInspect does not call GitHub APIs.
- The recipe uses fixture data only and does not require provider SDKs, credentials, network access, hosted ingestion, replay, or repository writes.
- Checks and artifact outputs are reports over existing trace inputs, not a new persisted trace schema.
