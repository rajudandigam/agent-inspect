# Show HN draft

**Title:** AgentInspect – local execution-tree debugger for TypeScript AI agents (no upload)

**Body:**

I built AgentInspect because debugging agents with `console.log` stopped scaling: parallel tools, nested LLM calls, and silent stalls are hard to reconstruct from flat logs. Hosted observability helps in production, but I wanted something **local and CLI-first** for the inner loop.

AgentInspect writes **JSONL execution trees** under `.agent-inspect/` — runs, steps, tool/LLM metadata (no raw prompts by default). You inspect with `list` / `view` / `report`, run **deterministic checks** in CI, and **redact** before attaching traces to issues.

**What’s new in v3.5.x (adoption polish):**

- Rewritten root README with a 60-second quickstart (`init --yes` → local demo)
- **Package README on npm** for every public `@agent-inspect/*` package
- Scenario docs: use cases, team workflows, first trace in 5 minutes
- `broken-agent-debugging` starter — deterministic wrong-tool failure → report → redact
- Static product diagrams (trace → check → redact loop)

**Earlier v3 highlights still true:**

- `agent-inspect init` + `doctor` onboarding
- Framework adapters: AI SDK, OpenAI Agents, LangChain (+ NestJS harness path)
- Optional VS Code extension in-repo (read-only; Marketplace listing pending)
- Performance/scale docs + stall/timeout check rules
- `@agent-inspect/adapter-sdk` for third-party adapters

No account, no cloud upload, MIT license.

```bash
npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
```

Website: https://agentinspect.vercel.app/  
Docs: https://agentinspect.vercel.app/docs/  
Repo: https://github.com/rajudandigam/agent-inspect  
5-min guide: https://agentinspect.vercel.app/docs/getting-started/  
Starters: https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters

I'd love feedback from anyone running TypeScript agents — especially what would make the first trace → first CI check path smoother.

**Comments prep:** Not LangSmith/Langfuse replacement; complements them. Not a hosted dashboard. VS Code extension is in-repo until Marketplace publish.
