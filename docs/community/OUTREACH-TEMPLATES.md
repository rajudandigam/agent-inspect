# Outreach templates

Feedback-first messages for maintainers. Customize names and links. **No pressure for PRs.**

Replace placeholders:

- `{name}` — recipient name or handle
- `{issue-url}` — live GitHub issue URL from [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)
- `{discussion-url}` — pinned stack survey Discussion URL

---

## General feedback-first message

Subject: AgentInspect 3.5.3 — would love your feedback

Hi {name},

I maintain [AgentInspect](https://agentinspect.vercel.app/) ([GitHub](https://github.com/rajudandigam/agent-inspect)) — a **local-first trace workbench** for TypeScript AI agents (manual traces, structured logs, optional framework adapters). **3.5.3** is on npm. Docs: https://agentinspect.vercel.app/docs/

If you have 10 minutes, I'd value your honest take:

- Would this fit your inner-loop debugging workflow?
- What's confusing or missing for your stack?

No PR expected — comments on {discussion-url} or a quick reply here is enough. If something resonates, we have scoped [good first issues](https://github.com/rajudandigam/agent-inspect/blob/main/GOOD-FIRST-ISSUES.md) when you're ready.

Thanks for building in the open.

---

## pino / log4js / NestJS message

Subject: JSON logging + AgentInspect — feedback from {name}?

Hi {name},

AgentInspect **1.1.0** includes a [logging playbook](https://github.com/rajudandigam/agent-inspect/blob/main/docs/LOGGING-PLAYBOOK.md) with pino, log4js, and NestJS recipes. The goal is **local** `agent-inspect logs` / `tail` on JSON you already emit — no vendor upload.

If you use {pino|log4js|Nest} in agentic workloads, I'd love to know:

- Does our field naming (`runId`, `event`, timestamp keys) match your logs?
- What would make the recipe more realistic for your team?

Optional issue if you want to contribute later: {issue-url}

---

## CLI timeline / stats message

Subject: Local agent debugging — timeline vs stats?

Hi {name},

We're exploring **local-only** CLI ideas for AgentInspect — chronological `timeline` and lightweight `stats` (no dashboard, no SaaS).

Which would help you more when debugging agent runs?

- Timeline-first output for log-derived runs
- Aggregate counts/durations/error rates per run

Design proposals welcome: {issue-url} (timeline) or stats sibling issue. Feedback in comments is enough — no implementation required to participate.

---

## OpenInference / export fixture message

Subject: OpenInference export fixture — contributor-friendly issue

Hi {name},

AgentInspect exports OpenInference-compatible JSON **locally** (experimental). We're adding a **canonical fixture + test** so contributors can verify export shape without claiming vendor certification.

If exports matter in your workflow, take a look at {issue-url}. Good first issue — fixtures, tests, docs only.

---

## LangChain streaming design message

Subject: LangChain streaming + persistence — design feedback

Hi {name},

`@agent-inspect/langchain` shipped **optional JSONL persistence** in 1.1.0. **Streaming** callbacks need a design pass before implementation (metadata-only defaults, size bounds, unified InspectEvent model).

Maintainer-owned design issue: {issue-url}. RFC-style comments welcome; please coordinate before runtime PRs.

---

## Decision metadata / eval workflow outreach

Subject: Branching agent workflows — decision metadata recipe

Hi {name},

We're adding a **decision metadata recipe** for local traces — how to record branch/route/guardrail choices in `inspectRun` metadata and structured logs **without** a hosted eval platform or replay engine.

If your agents branch on policies, models, or human gates, I'd love your feedback on what fields you'd actually log. Issue: {issue-url}. Comments only are perfect.

---

## Thank-you after issue feedback

Thanks {name} — really helpful. I've captured {specific point} for the roadmap / issue thread.

No PR expected. If you later want to own a scoped slice of {issue-url}, comment on the issue and we can align scope before you start.

---

## Thank-you after merged PR

Thanks {name} for the PR! Merged with {brief summary}.

I'll add you to [docs/community/CONTRIBUTORS.md](./CONTRIBUTORS.md) in the next release notes pass if you'd like recognition (MIT, no CLA).

If you're up for another pass, {issue-url} might be a good fit — totally optional.

---

## Tone guidelines

- Lead with **feedback**, not contribution quotas.
- Be specific about **one issue** when inviting ownership.
- Never imply production APM, SaaS, or vendor upload scope.
- Point to [SECURITY.md](../../SECURITY.md) when discussing traces/logs shared publicly.

---

## Additional templates (live issues)

Pick `{issue-url}` from [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md). Many below are open or recently shipped — verify before outreach.

### Winston logging recipe

Subject: Winston + AgentInspect — structured JSON recipe feedback

Hi {name},

AgentInspect ships pino, log4js, and NestJS logging recipes. We're adding a **Winston structured JSON** recipe so `agent-inspect logs` works on Winston-shaped lines — local only, no helper package yet.

If you use Winston with agents, does our field naming match your logs? Good first issue when ready: {issue-url}

---

### MCP fixture

Subject: MCP-style tool call fixtures — local trace shape feedback

Hi {name},

We're adding an MCP-**inspired** tool-call fixture (deterministic, no MCP SDK) to show how tool start/end/error metadata might look in local traces and JSON logs.

Not full MCP integration — fixture + docs only. Feedback or scoped PR welcome: {issue-url}

---

### Vercel AI SDK manual recipe / design

Subject: Vercel AI SDK — manual instrumentation before an adapter

Hi {name},

AgentInspect is exploring a **manual instrumentation recipe** for Vercel AI SDK-like flows (`generateText` / `streamText` mocks) before any `@agent-inspect/ai-sdk` package.

Manual recipe: {issue-url-manual} · Design note (RFC): {issue-url-design}

Comments on capture defaults (metadata-only) and non-goals are especially helpful.

---

### GitHub Actions CI artifact recipe

Subject: CI trace artifacts without a hosted observability platform

Hi {name},

We're documenting an **example** GitHub Actions workflow: run with `AGENT_INSPECT=1`, upload `.agent-inspect` JSONL or Markdown exports as artifacts — not a Vitest reporter package yet.

Does this match how your team debugs agent CI failures locally? Issue: {issue-url}

---

### Phoenix / OpenInference import recipe

Subject: OpenInference export — local Phoenix-oriented workflow (experimental)

Hi {name},

AgentInspect exports OpenInference-compatible JSON **locally** (experimental). We're adding docs on careful import/inspection boundaries — no Phoenix dependency, no vendor upload claims.

If you use Phoenix/OpenInference alongside local debugging: {issue-url}

---

### Safe trace sharing checklist

Subject: Sharing agent traces safely — checklist feedback

Hi {name},

Before traces land in issues, PRs, or Discussions, we want a short **safe sharing checklist** (redaction, metadata review, prefer Markdown export).

Security policy exists; this is the practical how-to. Good first docs issue: {issue-url}

---
