# Recipe: eval-ci-artifacts

## What this demonstrates

A CI-oriented local workflow that writes a deterministic trace, then shows how to run `agent-inspect eval` before creating safe local artifacts.

## Why this matters

Eval results, safety checks, and artifact rendering can run over the same local trace without replaying the agent or uploading data. GitHub Step Summary support is just local file output; artifact upload is owned by your CI YAML.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/eval-ci-artifacts
pnpm install
AGENT_INSPECT=1 pnpm start
```

Run eval and create artifacts:

```bash
npx agent-inspect eval eval-ci-fixture \
  --dir ./.agent-inspect-candidate \
  --require-success \
  --forbid-tool deleteAccount \
  --json

npx agent-inspect artifacts eval-ci-fixture \
  --dir ./.agent-inspect-candidate \
  --output-dir ./artifacts \
  --github-summary ./agent-inspect-summary.md
```

## Expected output

See `expected-output.txt`.

## Boundaries

- No real API keys, live model calls, hosted evals, or provider judging.
- AgentInspect does not call GitHub APIs or upload artifacts.
- Review generated summaries before sharing outside your team.
