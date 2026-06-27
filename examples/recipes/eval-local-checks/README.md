# Recipe: eval-local-checks

## What this demonstrates

A deterministic local eval over a RAG-shaped trace fixture using `@agent-inspect/eval`.

## Why this matters

The eval package lets CI or local scripts ask product-facing questions about an existing trace without replaying an agent, calling a model provider, uploading data, or creating a hosted dataset. Findings point to event IDs and paths instead of raw prompt, answer, or context text.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/eval-local-checks
pnpm install
pnpm start
```

Equivalent CLI shape for a trace file:

```bash
npx agent-inspect eval trace.jsonl \
  --require-success \
  --required-tool searchDocs \
  --citation-presence \
  --context-overlap \
  --json
```

## Expected output

See `expected-output.txt`.

## What to look for

- `evalRun()` consumes already-normalized local reader output.
- Grounding checks are deterministic heuristics: context overlap, citation presence, source IDs, answer bounds, and unsupported phrasing.
- The result is stable JSON or Markdown suitable for CI logs and local reports.

## Boundaries

- No LLM judge, provider SDK, network call, replay, or hosted dataset.
- Trace contents remain local and read-only.
- Findings include structural counts and evidence paths, not raw context or answer payloads.
