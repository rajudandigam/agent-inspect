# Use cases

Problem-oriented guide for AgentInspect. Each case links to a starter or doc.

## 1. Wrong tool call

**Problem:** The agent picked `search_docs` instead of `refund_policy`.

**Why logs alone are hard:** Provider logs show a tool name, not parent run context or sibling steps.

**Use:** `agent-inspect` CLI + local trace tree.

```bash
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect report <run-id> --dir .agent-inspect
```

**Output:** Step tree with tool metadata (not raw payloads by default).

**Safety:** Metadata-only default. Redact before sharing: `npx agent-inspect redact --profile share`.

**Starter:** [custom-observe](../examples/starters/custom-observe/README.md)

**Not:** Live model replay or hosted trace UI.

---

## 2. Eval failure — which step broke?

**Problem:** A Vitest eval failed; you need the failing step, not just the assertion message.

**Use:** `@agent-inspect/vitest` or `npx agent-inspect check`.

```bash
npx agent-inspect check .agent-inspect/*.jsonl --require-completed
```

**Starter:** [ci-eval-redact](../examples/starters/ci-eval-redact/README.md)

---

## 3. CI trace artifact on a failed PR

**Problem:** Reviewers need safe evidence without cloning your laptop.

**Use:** CI upload + `redact --profile share` + `verify-safe`.

**Doc:** [CI artifacts](./CI-ARTIFACTS.md)

---

## 4. Framework-native trace (AI SDK / OpenAI Agents / LangChain)

**Problem:** Manual `step()` calls do not match framework lifecycle.

**Use:** `@agent-inspect/ai-sdk`, `@agent-inspect/openai-agents`, or `@agent-inspect/langchain`.

**Starters:** [examples/starters](../examples/starters/README.md)

---

## 5. Safe incident handoff

**Problem:** You need to paste a trace into Slack or a GitHub issue.

**Use:** `@agent-inspect/redact` or CLI `redact` / `scan`.

**Doc:** [Safe trace sharing](./SAFE-TRACE-SHARING.md)

---

## 6. Multi-agent / session debugging

**Problem:** Handoffs and retries span multiple runs.

**Use:** `agent-inspect sessions`, `search`, `diff`.

---

## 7. MCP tool tracing

**Problem:** Which MCP tools were listed, called, and where did they fail?

**Use:** `@agent-inspect/mcp` (client tracing only).

---

## 8. Design partner adoption

**Problem:** Team wants one real agent instrumented in one sprint.

**Doc:** [Design partner guide](./DESIGN-PARTNER-GUIDE.md)

---

## 9. VS Code trace review

**Problem:** Browse `.agent-inspect/` from the editor.

**Use:** In-repo `packages/vscode` (F5 dev). Not on Marketplace yet.

**Doc:** [VS Code](./VSCODE.md)

---

## 10. Existing structured logs

**Problem:** You cannot change app code; logs already exist.

**Use:** `agent-inspect/logs` entry + CLI import helpers.

**Doc:** [Log-to-tree quickstart](./LOG-TO-TREE-QUICKSTART.md)

---

See also: [Real-world scenarios](./REAL-WORLD-SCENARIOS.md) · [Team workflows](./TEAM-WORKFLOWS.md)
