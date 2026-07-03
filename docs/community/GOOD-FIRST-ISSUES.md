# Good first issues (expanded)

Quick index: [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)

Use GitHub `#NNN` links — not archived draft markdown under [docs/archive/github/](../../docs/archive/github/).

---

## Live issues by lane (v3.5.x)

### OSS Hygiene

| Issue | Summary |
| ----- | ------- |
| [#9](https://github.com/rajudandigam/agent-inspect/issues/9) | Production observability comparison doc (v3 package map) |
| [#19](https://github.com/rajudandigam/agent-inspect/issues/19) | Keep contributor docs synced with live issues |
| [#67](https://github.com/rajudandigam/agent-inspect/issues/67) | Improve `agent-inspect doctor` troubleshooting messages |

### Examples and Fixtures

| Issue | Summary |
| ----- | ------- |
| [#10](https://github.com/rajudandigam/agent-inspect/issues/10) | Retry / circuit-breaker fixture pack |
| [#13](https://github.com/rajudandigam/agent-inspect/issues/13) | Decision metadata recipe (no chain-of-thought) |
| [#27](https://github.com/rajudandigam/agent-inspect/issues/27) | Log ingest config cookbook |
| [#29](https://github.com/rajudandigam/agent-inspect/issues/29) | LangChain persisted trace example |
| [#69](https://github.com/rajudandigam/agent-inspect/issues/69) | Streaming limitations — verify/expand [STREAMING-LIMITATIONS.md](../STREAMING-LIMITATIONS.md) |

### Adapter SDK Examples

| Issue | Summary |
| ----- | ------- |
| [#60](https://github.com/rajudandigam/agent-inspect/issues/60) | Minimal third-party adapter example |
| [#61](https://github.com/rajudandigam/agent-inspect/issues/61) | Adapter SDK privacy checklist |
| [#62](https://github.com/rajudandigam/agent-inspect/issues/62) | Custom renderer example |
| [#63](https://github.com/rajudandigam/agent-inspect/issues/63) | Custom transform example |

### UI and Performance Polish

| Issue | Summary |
| ----- | ------- |
| [#65](https://github.com/rajudandigam/agent-inspect/issues/65) | VS Code onboarding screenshots/GIF |
| [#66](https://github.com/rajudandigam/agent-inspect/issues/66) | VS Code: open sample trace command |
| [#68](https://github.com/rajudandigam/agent-inspect/issues/68) | Performance fixture pack (`pnpm perf:baseline`) |

### Standards and Graduation

| Issue | Summary |
| ----- | ------- |
| [#7](https://github.com/rajudandigam/agent-inspect/issues/7) | OpenInference export fixture (v3 schema) |
| [#25](https://github.com/rajudandigam/agent-inspect/issues/25) | Phoenix/OpenInference import graduation guide |

---

## Shipped (closed)

| Issue | Shipped as |
| ----- | ---------- |
| #8 | Diff CLI examples |
| #11–#12 | timeline / stats CLI (v1.4.0) |
| #14 | LangChain streaming metadata (v1.3.0) |
| [#18](https://github.com/rajudandigam/agent-inspect/issues/18) | First PR walkthrough via [#71](https://github.com/rajudandigam/agent-inspect/pull/71) |
| #20 | [INSTALL-SMOKE-TEST.md](../INSTALL-SMOKE-TEST.md) |
| #21 | winston-json-logs recipe |
| #22 | mcp-client-tracing recipe |
| #23–#24, #30 | AI SDK adapter + CI artifact recipes |
| #26 | [SAFE-TRACE-SHARING.md](../SAFE-TRACE-SHARING.md) |
| #28 | → [#68](https://github.com/rajudandigam/agent-inspect/issues/68) |
| #58–#59 | Roadmap + good-first index hygiene (2026-06-30) |
| [#64](https://github.com/rajudandigam/agent-inspect/issues/64) | Extension submission template via [#70](https://github.com/rajudandigam/agent-inspect/pull/70) |

Full table: [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md#shipped-closed--do-not-reopen).

---

## How to pick an issue

1. Start from a **live issue** in the lane tables above — e.g. [#7](https://github.com/rajudandigam/agent-inspect/issues/7), [#9](https://github.com/rajudandigam/agent-inspect/issues/9), [#19](https://github.com/rajudandigam/agent-inspect/issues/19), or [#60](https://github.com/rajudandigam/agent-inspect/issues/60) for first-time contributors.
2. **Comment** on the issue before opening a PR.
3. Match patterns in `fixtures/`, `examples/recipes/`, or `docs/`.
4. Run validation from [CONTRIBUTING.md](../../CONTRIBUTING.md).
5. Open a focused PR referencing the issue number.

Related: [DISCUSSIONS-STARTERS.md](./DISCUSSIONS-STARTERS.md) · [OUTREACH-TEMPLATES.md](./OUTREACH-TEMPLATES.md) · [CONTRIBUTOR-ROLES.md](./CONTRIBUTOR-ROLES.md)

---

## What not to pick first

| Area | Why |
| ---- | --- |
| **Unified persisted InspectEvent model** | Maintainer-owned schema/design |
| **Schema evolution** | Migration policy and compatibility |
| **Redaction / security internals** | Security review required |
| **Package exports** | Published layout and consumer contracts |
| **OTLP sink architecture** | Future opt-in only |
| **Official adapter internals** | Use `@agent-inspect/adapter-sdk` examples instead |

---

## Labels (reference)

`good first issue`, `documentation`, `help wanted`, `cli`, `examples`, `fixtures`, `exports`, `testing`, `logging`, `security`, `community contribution`, `roadmap`, `roadmap-next`, `langchain`, `adapter`, `maintainer-owned`.
