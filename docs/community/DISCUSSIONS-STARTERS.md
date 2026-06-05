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

### 1. Local traces vs logs — what do you use first?

Prompt: Do you start with `inspectRun` manual traces, structured log ingest (`logs` / `tail`), or the LangChain adapter? What friction did you hit?

Use responses to improve [docs/GETTING-STARTED.md](../GETTING-STARTED.md) and recipes.

### 2. Export and review workflows

Prompt: Do you export traces to Markdown, OpenInference JSON, or OTLP JSON for review? What do you wish the export included (while staying local-first)?

Informs fixture and export docs work ([LIVE_ISSUE_BATCH_01](../../.github/LIVE_ISSUE_BATCH_01/001-add-openinference-export-fixture.md)).

### 3. What would make AgentInspect a daily driver?

Prompt: What one CLI command, fixture, or adapter improvement would make you reach for AgentInspect every day during agent development?

Maps feedback to ROADMAP **Next** (`timeline`, `stats`, unified InspectEvent model).

---

## Maintainer notes

- Pin only one discussion at a time to avoid clutter.
- Summarize themes weekly into ROADMAP / Issues — do not promise delivery dates in replies.
- Redirect implementation requests to live Issues once batch 01 is open.
