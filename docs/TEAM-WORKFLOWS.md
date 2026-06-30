# Team workflows

How teams adopt AgentInspect without a hosted platform.

## Solo developer (day 1)

1. `npm install agent-inspect && npx agent-inspect init --yes`
2. Run demo: `node examples/agent-inspect-demo.mjs`
3. `npx agent-inspect view <run-id>`
4. Before posting issues: `npx agent-inspect redact --profile share`

## PR / code review

- Add `@agent-inspect/vitest` or `@agent-inspect/jest` reporter
- Upload `.agent-inspect/**/*.jsonl` as CI artifact on failure
- Reviewer downloads artifact and runs `agent-inspect report` locally

See [CI artifacts](./CI-ARTIFACTS.md).

## Design partner sprint

| Week | Action |
| ---- | ------ |
| 1 | Pick one agent path (adapter or observe) |
| 2 | Add one deterministic check rule |
| 3 | Redact + share one artifact with the team |

Checklist: [DESIGN-PARTNER-GUIDE.md](./DESIGN-PARTNER-GUIDE.md).

## Enterprise / no-cloud constraint

- All traces stay on disk under `AGENT_INSPECT_TRACE_DIR`
- No account, no default upload
- `verify-safe` before any export
- Redaction profiles: `local` → `share` → `strict`

## Framework owners

- AI SDK: metadata-only telemetry; `recordInputs: false`, `recordOutputs: false`
- OpenAI Agents: local-only processor mode (see [OPENAI-AGENTS-LOCAL.md](./OPENAI-AGENTS-LOCAL.md))
- LangChain: callback with `persist: true`

## What teams should not expect

- Org-wide trace search SaaS
- LLM-as-judge eval platform
- Compliance certification from redaction alone
