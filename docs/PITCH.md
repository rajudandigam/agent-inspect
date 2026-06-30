# Pitch (60 seconds)

**Problem:** AI agents are graphs of steps — tools, LLMs, retries, parallel work. `console.log` gives you a flat stream. Production observability is great later, but heavy for the inner loop.

**Solution:** AgentInspect captures a **local execution tree** for TypeScript agents: runs, nested steps, durations, errors, metadata-only by default. Inspect with the CLI, optional viewer, and an in-repo VS Code extension. Run **deterministic checks** and **eval heuristics** in CI. **Redact** before you share.

**How it works:** `observe()` or a framework adapter writes JSONL under `.agent-inspect/`. No account. No upload. Your disk.

**Frameworks:** AI SDK, OpenAI Agents JS, LangChain — plus manual steps and log ingest recipes.

**CI story:** `check`, `eval`, `redact`, `ci-summary` — artifacts you can gate merges on.

**Not:** A hosted dashboard, prompt store, or replacement for LangSmith/Langfuse in production.

**Try it:**

```bash
npm install agent-inspect
npx agent-inspect init --framework ai-sdk --yes
```

Starters: [examples/starters/](../examples/starters/README.md) · Docs: [ADOPTION.md](./ADOPTION.md)
