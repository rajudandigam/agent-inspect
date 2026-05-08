# Recipe: rag-pipeline

## What this demonstrates

A **mock retrieval-augmented generation** flow: embedding dimensions are fake numbers, “documents” are in-memory strings, reranking picks the top item, and the final answer is a deterministic stub—yet the **execution tree** matches how you would structure a real RAG agent.

## Why this matters

You can inspect **ordering**, **tool boundaries**, and **LLM steps** without wiring Pinecone, OpenAI, or embeddings APIs. The trace shows exactly what ran before you add real backends.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/rag-pipeline
pnpm install
pnpm start
```

Optional quiet tracing:

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

Traces are written under `./.agent-inspect-runs/` (gitignored).

## Expected output

See `expected-output.txt`. Console ends with `RAG result:` and a fixture summary line.

## What to look for

In `agent-inspect list` / `view`, steps should appear in order: **embed-query** → **retrieve-documents** → **rerank-results** → **generate-answer**.

```bash
npx agent-inspect list --dir ./.agent-inspect-runs
npx agent-inspect view <run_id> --dir ./.agent-inspect-runs
```

## Notes and limitations

- Not a real embedding model or vector store.
- Does not perform semantic search.
- Suitable for layout and tracing discipline only—not retrieval quality.

## Version ownership

v0.9 adoption hardening (recipes pass 2).
