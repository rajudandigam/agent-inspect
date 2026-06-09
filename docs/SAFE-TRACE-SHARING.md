# Safe trace sharing checklist

AgentInspect traces, log-ingest outputs, and exports are local files. They may still contain sensitive metadata that you attached manually, collected from logs, or included through optional preview settings. Use this checklist before sharing an artifact in a GitHub issue, Discussion, PR, support thread, or public post.

This guide is practical sharing guidance, not a guarantee that any artifact is safe to publish.

## Before sharing

- Prefer redacted output. Keep exporter defaults unless you have a specific reason to include more detail.
- Treat traces written with `redact: false` as sensitive. Review every event before sharing them outside your team.
- Inspect manual metadata passed to `inspectRun()`, `step()`, `step.tool()`, `step.llm()`, or `observe()`.
- Inspect log-derived fields from `logs` / `tail` ingest configs, including custom `run-id`, `event`, `parent`, timestamp, and attribute mappings.
- Avoid posting raw prompts, completions, tool inputs, or tool outputs in public threads unless the content is approved for public disclosure.
- Prefer Markdown export for issue or PR sharing when a summarized tree is enough.

## Remove or replace sensitive values

Search the artifact for:

- API keys, bearer tokens, cookies, session IDs, JWTs, OAuth codes, and webhook secrets
- passwords, private keys, certificates, signing secrets, and database URLs
- email addresses, phone numbers, physical addresses, usernames, and customer IDs
- internal hostnames, service URLs, ticket IDs, order IDs, account IDs, and tenant IDs
- proprietary prompts, system instructions, model outputs, retrieved documents, and tool responses
- file paths that expose user names, project names, or internal directory layouts

Replace sensitive data with clear placeholders such as `example.test`, `user@example.test`, `CUSTOMER_ID_REDACTED`, or `TOKEN_REDACTED`.

## Export and ingest-specific checks

- Markdown / HTML exports: review rendered text and copied snippets, not only the source trace.
- OpenInference / OTLP JSON exports: check attributes, span names, events, and resource metadata.
- Structured log ingest configs: confirm mapped keys do not pull in full request bodies, headers, raw prompts, or unbounded output fields.
- LangChain adapter traces: keep `capture: "metadata-only"` for shareable examples; review `capture: "preview"` traces carefully because previews can include prompt or output fragments.

## Final review

- Open the exact file you plan to share and search for common sensitive strings: `token`, `secret`, `authorization`, `cookie`, `password`, `email`, `apiKey`, `key`, `jwt`, `bearer`.
- Confirm any screenshots do not show terminal history, environment variables, browser account data, or private repository names.
- Share the smallest useful artifact: a summary, selected excerpt, or minimized synthetic reproduction is better than a full trace.
- If the artifact includes production or customer data, do not share it publicly. Use a private security or support channel.

See [SECURITY.md](../SECURITY.md) for the security policy and redaction expectations.
