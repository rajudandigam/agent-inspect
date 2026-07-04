# Pitch (60 seconds)

**Problem:** AI agents are graphs of steps — tools, LLMs, retries, parallel work. `console.log` gives you a flat stream. Production observability is great later, but heavy for the inner loop.

**Solution:** AgentInspect captures a **local execution tree** for TypeScript agents: runs, nested steps, durations, errors, metadata-only by default. Inspect with the CLI, optional viewer, and an in-repo VS Code extension. Run **deterministic checks** and **eval heuristics** in CI. **Redact** before you share.

**How it works:** `observe()` or a framework adapter writes JSONL under `.agent-inspect/`. No account. No upload. Your disk.

**Frameworks:** AI SDK, OpenAI Agents JS, LangChain — each with an npm package README. Manual steps and log-ingest recipes for everything else.

**CI story:** `check`, `eval`, `redact`, `verify-safe` — artifacts you can gate merges on.

**Not:** A hosted dashboard, prompt store, or replacement for LangSmith/Langfuse in production.

**Try it (under 5 minutes):**

```bash
npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
npx agent-inspect report <run-id> --dir .agent-inspect
```

**Website:** [https://agentinspect.vercel.app/](https://agentinspect.vercel.app/) · **Docs:** [https://agentinspect.vercel.app/docs/](https://agentinspect.vercel.app/docs/)

**Demo flow:** [broken-agent-debugging starter](../examples/starters/broken-agent-debugging/)
**Guides:** [FIRST-TRACE-IN-5-MINUTES.md](./FIRST-TRACE-IN-5-MINUTES.md) · [ADOPTION.md](./ADOPTION.md) · [Package map](https://github.com/rajudandigam/agent-inspect#package-map)
