# Show HN draft

**Title:** AgentInspect – local execution-tree debugger for TypeScript AI agents

**Body:**

I built AgentInspect because debugging agents with `console.log` stopped scaling: parallel tools, nested LLM calls, and silent stalls are hard to reconstruct from flat logs. Hosted observability helps in production, but I wanted something **local and CLI-first** for the inner loop.

AgentInspect writes **JSONL execution trees** under `.agent-inspect/` — runs, steps, tool/LLM metadata (no raw prompts by default). You inspect with `list` / `view` / `timeline` / `report`, run **deterministic checks** in CI, and **redact** before attaching traces to issues.

**v3 highlights:**

- `agent-inspect init` + `doctor` onboarding
- Framework guides: AI SDK, OpenAI Agents, LangChain, NestJS harness path
- Optional VS Code extension in-repo (read-only; Marketplace listing pending)
- Performance/scale docs + stall/timeout check rules
- `@agent-inspect/adapter-sdk` for third-party adapters

No account, no cloud upload, MIT license.

```bash
npm install agent-inspect
npx agent-inspect init --framework custom --yes
```

Repo: https://github.com/rajudandigam/agent-inspect  
Starters: `examples/starters/`  
I'd love feedback from anyone running TypeScript agents in production — especially what would make the first trace → first CI check path smoother.
