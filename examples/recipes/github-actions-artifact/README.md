# Recipe: github-actions-artifact

## What this demonstrates

A **deterministic CI-style job** that writes local AgentInspect traces when `AGENT_INSPECT=1`, then exports a **share-safe** markdown artifact. Upload uses **GitHub Actions** `upload-artifact` — AgentInspect itself never calls the network.

## Why this matters

You can attach trace summaries to CI runs for debugging failed agent tests without adopting a hosted observability platform. Review exports before sharing — see [docs/SAFE-TRACE-SHARING.md](../../../docs/SAFE-TRACE-SHARING.md).

## How to run locally

From the repository root:

```bash
pnpm build
cd examples/recipes/github-actions-artifact
pnpm install
AGENT_INSPECT=1 pnpm start
```

Traces land in `./.agent-inspect/` (or `AGENT_INSPECT_TRACE_DIR`).

Export a share-safe copy:

```bash
npx agent-inspect export ci-fixture-agent \
  --dir ./.agent-inspect \
  --format markdown \
  --redaction-profile share
```

## GitHub Actions

See `workflow-example.yml` — copy into `.github/workflows/` and adjust paths for your repo layout.

Full guide: [docs/CI-ARTIFACTS.md](../../../docs/CI-ARTIFACTS.md).

## Expected output

See `expected-output.txt`.

## Boundaries

- No API keys or external LLM calls
- No vendor upload from AgentInspect
- Metadata-only tracing (`redact` defaults on)
- Review artifacts before posting to issues or PRs
