# Design-partner feedback — anonymized synthetic example

**This is a fully synthetic example. It describes no real user, company, or production system.** It shows how to fill the [design-partner / public-proof feedback form](../../.github/ISSUE_TEMPLATE/design_partner_feedback.yml) with safe, shareable content.

See also: [Design partner guide](../DESIGN-PARTNER-GUIDE.md) · [Safe trace sharing](../SAFE-TRACE-SHARING.md) · [Anonymized case-study template](./ANONYMIZED-CASE-STUDY-TEMPLATE.md).

---

**AgentInspect version:** `agent-inspect@6.17.3`

**Node / OS:** Node 20.x on Ubuntu 22.04

**Stack:** langchain / LangGraph (synthetic support-triage agent)

**Scenario:** A synthetic two-node LangGraph agent that plans a refund and calls a `refund_order` tool. Traced locally with the LangChain callback; no external services involved.

**Golden-path steps:**

- First trace (< 30 min from install): ~12 minutes, using `agent-inspect init` plus the langchain starter.
- First CI check on a trace: passed a `requiredTools: ["refund_order"]` TraceContract on the fixture run.
- Share-checked evidence bundle attached to an issue/PR: built with `--profile share`, verified with `bundle verify`, attached as a CI artifact.

**Retained CI workflow:** Yes — running in CI. A retained TraceContract gate runs on each PR against a synthetic fixture.

**Studio trial status:** Tried it (read-only, local).

**Blockers:** None blocking. One paper cut: remembering to pass `--profile share` before attaching a bundle; solved by scripting the bundle step.

**Keep-using decision:** Yes.

**Safe summary:** A synthetic LangGraph refund agent went from install to a retained CI TraceContract gate in under half an hour, with a share-checked evidence bundle attached to the PR. All data synthetic.

**Privacy confirmation:** Synthetic data only; no production traces, secrets, tokens, or customer data attached.
