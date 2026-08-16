# Anonymized technical case-study template

Use this template when contributing a public-safe AgentInspect case study. Keep
it technical, reproducible, and anonymized. Prefer synthetic or minimized data
over raw production traces.

## Submission metadata

- **Title:**
- **Contributor / organization:**
- **GitHub handle:**
- **Date:**
- **AgentInspect version:**
- **Package or surface used:** `agent-inspect` / adapter / reporter / MCP / other
- **Stack:** framework, runtime, test runner, CI, and operating system
- **Support level:** stable / preview / experimental

## Scenario

Describe the agent workflow in neutral terms.

- **Agent type:** coding agent / support agent / workflow agent / other
- **Primary task:**
- **Tools or integrations involved:**
- **Local-only or CI:**
- **Synthetic fixture or minimized reproduction used:** yes / no

Do not include customer names, private repository names, internal hostnames, raw
prompts, raw completions, API responses, or production log excerpts unless they
have been explicitly approved for public disclosure.

## What broke

Summarize the failure mode.

- **Symptom:**
- **Where it appeared:** local run / CI / PR review / support report
- **Expected behavior:**
- **Actual behavior:**
- **Why normal logs were insufficient:**

Use placeholders such as `example.test`, `user@example.test`,
`CUSTOMER_ID_REDACTED`, and `TOKEN_REDACTED` for anything sensitive.

## What AgentInspect captured

Explain the evidence surface without attaching unsafe raw traces.

- **Evidence or TraceContract surface:**
- **Important step / tool / assertion:**
- **First causal failure identified:**
- **Relevant command:**

```bash
# Example only; replace with the exact command you ran.
npx agent-inspect report <run-id>
```

If you attach an artifact, attach the smallest useful redacted excerpt. Prefer a
Markdown summary, selected snippet, or synthetic fixture over a full trace.

## Outcome

- **Fix or mitigation:**
- **Verification command:**
- **Result after fix:**
- **Remaining limitation or follow-up:**

## Public-safe evidence checklist

Before submitting, confirm:

- [ ] The case study uses synthetic, minimized, or approved-for-public data.
- [ ] No API keys, bearer tokens, cookies, credentials, or webhook secrets appear.
- [ ] No customer names, tenant IDs, account IDs, internal hostnames, private paths, or proprietary prompts appear.
- [ ] Raw prompts, completions, tool inputs, and tool outputs are omitted or explicitly approved for public disclosure.
- [ ] Any attached trace/export was generated with a share-safe redaction profile and then manually reviewed.
- [ ] Screenshots do not expose terminal history, environment variables, account details, or private repository names.
- [ ] The write-up states the AgentInspect version and exact validation command.

See also [Safe trace sharing checklist](../SAFE-TRACE-SHARING.md).
