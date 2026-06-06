# GitHub Discussions starters

Use this guide when enabling **Discussions** on [rajudandigam/agent-inspect](https://github.com/rajudandigam/agent-inspect) after the 1.1.0 publish.

## Enable Discussions (maintainer)

1. GitHub repo → **Settings** → **General** → **Features** → enable **Discussions**.
2. Choose categories below (edit defaults to match).
3. Create and **pin** the stack survey discussion.
4. Link Discussions from [README.md](../../README.md) (optional) and outreach messages.

## Suggested categories

| Category | Purpose |
| -------- | ------- |
| **General** | Questions, ideas, show-and-tell |
| **Integrations & stacks** | LangChain, pino/log4js/Nest, Vercel AI SDK, direct SDK agents |
| **Feedback** | What worked / what confused you after trying 1.1.0 |
| **Show and tell** | Traces, recipes, export workflows (redact before posting) |
| **Q&A** | How do I … with AgentInspect? |
| **Ideas** | Feature ideas — maintainers map to ROADMAP Next/Future |

Keep **Issues** for actionable, scoped work; use **Discussions** for open-ended feedback.

---

## First pinned discussion

**Title:** What stack are you using with AgentInspect?

**Category:** Integrations & stacks (or General)

**Body:**

AgentInspect **1.1.0** is on npm. It adds local traces, env-gated tracing (`maybeInspectRun` / `AGENT_INSPECT`), redaction before disk, optional LangChain JSONL persistence, and JSON logging recipes (pino, log4js, NestJS).

**What are you building with?**

- Manual TypeScript agents
- LangChain.js
- Vercel AI SDK
- NestJS workers
- pino / log4js / winston logs
- OpenAI / Anthropic SDK directly
- Other (tell us)

**What would help most next?**

- Better CLI (`timeline`, `stats`)
- More fixtures / examples
- LangChain streaming persistence design
- OpenInference / export fixtures
- Something else

I'm using this thread to prioritize integrations and examples. No pressure to open a PR — feedback first is perfect.

If you share logs or traces, please **redact secrets** and avoid production customer data. See [SECURITY.md](../../SECURITY.md).

---

## Follow-up discussion ideas

### 1. What should AgentInspect support next?

**Title:** What should AgentInspect support next: timeline, stats, CI artifacts, or Vercel AI SDK?

Prompt: AgentInspect stays **local-first** — no dashboard, no vendor upload. Which **Next** direction would help your team most?

- `timeline` CLI (chronological log/trace view)
- `stats` CLI (local aggregates per run)
- CI trace artifacts / Vitest-style reporters
- Vercel AI SDK adapter (metadata-first, experimental)

Comment with your stack and why. Maintainers map votes to [ROADMAP.md](../../ROADMAP.md) — not a commitment to ship on a date.

### 2. What logging stack should AgentInspect support better?

**Title:** What logging stack should AgentInspect support better?

Prompt: 1.1.0 shipped recipes for **pino**, **log4js**, and **NestJS**. What should we improve next?

- Field naming (`runId`, `event`, timestamps)
- Winston / Bunyan / other JSON loggers
- NestJS / worker job patterns you use in production-shaped dev
- Optional helper packages (Future roadmap — not required for core)

Share a **redacted** sample line if you can. See [docs/LOGGING-PLAYBOOK.md](../LOGGING-PLAYBOOK.md).

### 3. What would make local agent traces easier to share safely?

**Title:** What would make local agent traces easier to share safely?

Prompt: Traces stay on disk by default; exports are for **review before sharing**. What would help you share debugging context with teammates without leaking secrets?

- Better redaction defaults or docs
- Markdown / OpenInference export improvements
- Smaller fixture examples for PRs and postmortems
- Decision-metadata patterns for branching workflows

Do not post production customer data. See [SECURITY.md](../../SECURITY.md).

---

## Maintainer notes

- Pin only one discussion at a time to avoid clutter.
- Summarize themes weekly into ROADMAP / Issues — do not promise delivery dates in replies.
- Redirect implementation requests to live Issues once batch 01 is open.
