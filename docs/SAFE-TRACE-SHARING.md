# Safe trace sharing checklist

**Docs site:** [https://agentinspect.vercel.app/docs/safe-sharing/](https://agentinspect.vercel.app/docs/safe-sharing/)

AgentInspect traces, log-ingest outputs, and exports are local files. They may still contain sensitive metadata that you attached manually, collected from logs, or included through optional preview settings. Use this checklist before sharing an artifact in a GitHub issue, Discussion, PR, support thread, or public post.

This guide is practical sharing guidance, not a guarantee that any artifact is safe to publish. Redaction profiles are **best-effort transformation**, not compliance-grade DLP or a safety certification. Always finish with `verify-safe` before sharing.

Built-in profiles redact high-confidence credential forms (provider keys, JWTs, bearer tokens, and bounded `token=` / `api_key=` / `internal_token=` style key/value secrets). Broad or context-sensitive findings—such as private filesystem paths—may still appear under `verify-safe` and require human review. Org-specific patterns can be added programmatically with custom detectors, or from the CLI with a bounded local policy file (`--policy`, 6.18+); see [SAFETY-POLICY.md](./SAFETY-POLICY.md#bounded-local-cli-policy-618).

`strict` is a stricter **rule set** (more keys), not a promise that every input produces bytes different from `share`.

## Quick presets (v1.3.0+)

- **`--redaction-profile share`** — PRs, GitHub issues, Slack/email threads inside your org. Redacts correlation IDs, customer/user IDs, and common contact fields.
- **`--redaction-profile strict`** — external sharing or public posts. Also redacts prompt/output/message-like metadata keys.
- **Default (`local`)** — same as before; still review before sharing.

```bash
npx agent-inspect export <run-id> --format markdown --redaction-profile share
npx agent-inspect export <run-id> --format html --redaction-profile strict
npx agent-inspect redact trace.jsonl --profile share --json
```

Original trace files under `.agent-inspect-runs/` are **not modified** by export or `redact` copy workflows.

### Default redaction before disk

![Sensitive metadata keys redacted in trace output](../assets/demos/redaction.gif)

Manual traces redact common sensitive keys **before disk** by default. Pass `redact: false` only when you accept the risk locally.

## Before sharing

When a maintainer or support responder needs reproducible evidence, follow the [safe support reproduction workflow](./SUPPORT-REPRODUCTION.md) to create and review a minimized Evidence bundle. Do not attach a raw trace directory.

- Use **`--redaction-profile share`** for PR/issue attachments; use **`strict`** when sharing outside your team.
- **Review** the exported file — profiles do not detect all sensitive data.
- Treat traces written with `redact: false` as sensitive. Review every event before sharing them outside your team.
- Inspect manual metadata passed to `inspectRun()`, `step()`, `step.tool()`, `step.llm()`, or `observe()`.
- Inspect log-derived fields from `logs` / `tail` ingest configs, including custom `run-id`, `event`, `parent`, timestamp, and attribute mappings.
- Avoid posting raw prompts, completions, tool inputs, or tool outputs in public threads unless the content is approved for public disclosure.
- For cross-system correlation, retain a bounded identifier instead of copying the external record or payload. Follow [External reference metadata](./EXTERNAL-REFERENCES.md), and expect `share` / `strict` profiles to redact the named correlation fields.
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
- Eval JSON / Markdown: review failed-rule messages, expected/actual summaries, source IDs, and evidence paths before attaching them to PRs or issues.
- Redacted copies from `agent-inspect redact`: review the output file itself; findings show detector/path/action evidence but do not certify full safety. The `residualAssessment` field (6.18+) reports what `verify-safe` would still flag in the redacted copy; `--fail-on-residual` turns that into a non-zero exit in CI.
- OpenInference / OTLP JSON exports: check attributes, span names, events, and resource metadata.
- Structured log ingest configs: confirm mapped keys do not pull in full request bodies, headers, raw prompts, or unbounded output fields.
- LangChain adapter traces: keep `capture: "metadata-only"` for shareable examples; review `capture: "preview"` traces carefully because previews can include prompt or output fragments.
- Third-party adapter packages: follow the [Adapter SDK privacy checklist](./ADAPTER-SDK-PRIVACY.md) before sharing adapter traces, examples, or registry submissions.

## When to use each profile

| Situation | Profile | Format tip |
| --------- | ------- | ---------- |
| Local debugging only | `local` (default) | Full CLI `view` is fine on your machine |
| PR or GitHub issue attachment | `share` | `export --format markdown --redaction-profile share` |
| External blog, public forum, customer-facing | `strict` | Review twice; prefer synthetic/minimal repro |
| Local JSON/JSONL copy for review | `share` or `strict` | `redact <file> --profile share --json` |
| Security incident or secret leak suspicion | — | Do not post traces publicly; use [SECURITY.md](../SECURITY.md) |

## Guardrails and circuits (v2.5 planning)

- Optional `@agent-inspect/guardrails` and `@agent-inspect/circuit` packages evaluate local text/JSON/trace patterns deterministically.
- They reuse `@agent-inspect/redact` for PII-style findings where applicable — same best-effort limits as redaction profiles.
- They are **not** compliance tools and do not guarantee an artifact is safe to publish.
- Circuits detect repetition, retries, and width in traces or explicit counters; they do not stop runaway agents unless your code enforces results.

## What this guide does not claim

- Redaction profiles are **not** GDPR/HIPAA/SOC2 compliance tools.
- Export redaction does **not** upload anywhere — it only shapes a local copy.
- No automated scan guarantees an artifact is safe to publish.

## Final review

- Open the exact file you plan to share and search for common sensitive strings: `token`, `secret`, `authorization`, `cookie`, `password`, `email`, `apiKey`, `key`, `jwt`, `bearer`.
- Confirm any screenshots do not show terminal history, environment variables, browser account data, or private repository names.
- Share the smallest useful artifact: a summary, selected excerpt, or minimized synthetic reproduction is better than a full trace.
- If the artifact includes production or customer data, do not share it publicly. Use a private security or support channel.

See [SECURITY.md](../SECURITY.md) for the security policy and redaction expectations.
