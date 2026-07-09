# Recipe: github-actions-gate

## What this demonstrates

Run `agent-inspect gate` against a local suite config and write CI-friendly artifacts (`gate-results.json`, `junit.xml`, `github-step-summary.md`, etc.) for GitHub Actions or other CI systems.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/github-actions-gate
pnpm install
pnpm start
```

## Expected output

See `expected-output.txt`. Exit code **0** when the gate passes.

## Boundaries

- Reads existing traces only; no network, no provider SDK, no replay.
- Artifact upload to GitHub is user-owned CI YAML; AgentInspect does not call GitHub APIs.
