# Outreach templates (post-1.1.0)

Feedback-first messages for maintainers. Customize names and links. **No pressure for PRs.**

Replace placeholders:

- `{name}` — recipient name or handle
- `{issue-url}` — live GitHub issue URL (after batch 01 is created)
- `{discussion-url}` — pinned stack survey Discussion URL

---

## General feedback-first message

Subject: AgentInspect 1.1.0 — would love your feedback

Hi {name},

I maintain [AgentInspect](https://github.com/rajudandigam/agent-inspect) — a **local-first trace workbench** for TypeScript AI agents (manual traces, structured logs, optional LangChain adapter). **1.1.0** is on npm.

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

## Follow-up after someone comments

Thanks {name} — this is exactly the kind of feedback we need. I've noted {specific point} for the roadmap.

If you want to go further, {issue-url} is scoped and contributor-friendly. No rush — happy to answer questions in the thread.

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
