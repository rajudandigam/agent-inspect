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

**Safety:** Metadata-only default. Redact before sharing:

```bash
npx agent-inspect redact <run-id> --dir .agent-inspect --profile share -o safe.jsonl
npx agent-inspect verify-safe <run-id> --dir .agent-inspect
```

**Starter:** [broken-agent-debugging](../examples/starters/broken-agent-debugging/README.md) (same final answer, wrong trajectory — `node prove-same-output-wrong-path.mjs`) or [custom-observe](../examples/starters/custom-observe/README.md)

**Not:** Live model replay or hosted trace UI.

---

## 2. Eval failure — which step broke?

**Problem:** A Vitest eval failed; you need the failing step, not just the assertion message.

**Use:** `@agent-inspect/vitest` or `npx agent-inspect check`.

```bash
npx agent-inspect check <run-id> --dir .agent-inspect
```

**Starter:** [ci-eval-redact](../examples/starters/ci-eval-redact/README.md)

---

## 3. CI trace artifact on a failed PR

**Problem:** Reviewers need safe evidence without cloning your laptop.

**Use:** CI upload + `redact <run-id> --dir … --profile share` + `verify-safe <run-id>` + optional `bundle` / `bundle verify`.

**Doc:** [CI artifacts](./CI-ARTIFACTS.md)

---

## 4. Framework-native trace (AI SDK / OpenAI Agents / LangChain)

**Problem:** Manual `step()` calls do not match framework lifecycle.

**Use:** `@agent-inspect/ai-sdk`, `@agent-inspect/openai-agents`, or `@agent-inspect/langchain`.

**Starters:** [examples/starters](../examples/starters/README.md)

---

## 5. Safe incident handoff

**Problem:** You need to paste a trace into Slack or a GitHub issue.

**Use:** `@agent-inspect/redact` or CLI `redact` / `scan` / `bundle` with a run id or path target.

**Doc:** [Safe trace sharing](./SAFE-TRACE-SHARING.md)

---

## 6. Multi-agent / session debugging

**Problem:** Handoffs and retries span multiple runs.

**Use:** `agent-inspect sessions`, `search`, `diff`.

---

## 7. Ask a coding agent what failed first (MCP)

**Problem:** You want Cursor/Claude/Codex to inspect a local failing run without uploading traces.

**Use:** `@agent-inspect/mcp-server` + `agent-inspect mcp configure` (dry-run by default).

```bash
npx agent-inspect mcp configure --client cursor
cd examples/starters/coding-agent-debug-loop && pnpm start && pnpm run inspect-mcp
```

Ask the agent for `get_first_causal_failure` / `create_share_checked_evidence`.

**Docs:** [CODING-AGENT-LOOP.md](./CODING-AGENT-LOOP.md) · **Starter:** [coding-agent-debug-loop](../examples/starters/coding-agent-debug-loop/README.md)

**Not:** Remote MCP gateway or default network upload.

---

## 8. MCP client tool tracing

**Problem:** Which MCP tools were listed, called, and where did they fail?

**Use:** `@agent-inspect/mcp` (client tracing only — distinct from the coding-agent MCP **server** loop above).

---

## 9. Design partner adoption

**Problem:** Team wants one real agent instrumented in one sprint.

**Doc:** [Design partner guide](./DESIGN-PARTNER-GUIDE.md) · [Pilot kit](./PRE-V7-PILOT-KIT.md)

---

## 10. VS Code trace review

**Problem:** Browse `.agent-inspect/` from the editor.

**Use:** In-repo `packages/vscode` (F5 dev). Not on Marketplace yet.

**Doc:** [VS Code](./VSCODE.md)

---

## 11. Existing structured logs

**Problem:** You cannot change app code; logs already exist.

**Use:** `agent-inspect/logs` entry + CLI import helpers.

**Doc:** [Log-to-tree quickstart](./LOG-TO-TREE-QUICKSTART.md)

---

See also: [Team workflows](./TEAM-WORKFLOWS.md)
