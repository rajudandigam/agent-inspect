# Good first issues

Curated entry points for contributors. Expanded notes: [docs/community/GOOD-FIRST-ISSUES.md](docs/community/GOOD-FIRST-ISSUES.md) · hygiene plan: [docs/community/ISSUE-HYGIENE-PLAN.md](docs/community/ISSUE-HYGIENE-PLAN.md)

**Comment on an issue before opening a PR.** Prepared batch 03 (not live until maintainer runs script): [.github/LIVE_ISSUE_BATCH_03/](.github/LIVE_ISSUE_BATCH_03/)

Historical bodies: [.github/LIVE_ISSUE_BATCH_01/](.github/LIVE_ISSUE_BATCH_01/) · [.github/LIVE_ISSUE_BATCH_02/](.github/LIVE_ISSUE_BATCH_02/) · drafts: [.github/ISSUE_DRAFTS/](.github/ISSUE_DRAFTS/)

---

## OSS contribution lanes (post-v3.5)

| Lane | Live issues | Batch 03 (prepared) |
| ---- | ----------- | ------------------- |
| **OSS Hygiene** | [#9](https://github.com/rajudandigam/agent-inspect/issues/9), [#18](https://github.com/rajudandigam/agent-inspect/issues/18), [#19](https://github.com/rajudandigam/agent-inspect/issues/19) | [#031](.github/LIVE_ISSUE_BATCH_03/031-align-public-roadmap-with-current-release.md), [#032](.github/LIVE_ISSUE_BATCH_03/032-refresh-good-first-issues-for-v3.md), [#040](.github/LIVE_ISSUE_BATCH_03/040-improve-doctor-troubleshooting-messages.md) |
| **Examples and Fixtures** | [#10](https://github.com/rajudandigam/agent-inspect/issues/10), [#13](https://github.com/rajudandigam/agent-inspect/issues/13), [#22](https://github.com/rajudandigam/agent-inspect/issues/22), [#27](https://github.com/rajudandigam/agent-inspect/issues/27), [#28](https://github.com/rajudandigam/agent-inspect/issues/28), [#29](https://github.com/rajudandigam/agent-inspect/issues/29) | [#042](.github/LIVE_ISSUE_BATCH_03/042-streaming-limitations-examples.md) |
| **Adapter SDK Examples** | — | [#033](.github/LIVE_ISSUE_BATCH_03/033-minimal-adapter-sdk-third-party-example.md)–[#037](.github/LIVE_ISSUE_BATCH_03/037-extension-registry-submission-template.md) |
| **UI and Performance Polish** | — | [#038](.github/LIVE_ISSUE_BATCH_03/038-vscode-extension-onboarding-screenshots.md)–[#041](.github/LIVE_ISSUE_BATCH_03/041-performance-fixture-pack.md) |
| **Standards and Graduation** | [#7](https://github.com/rajudandigam/agent-inspect/issues/7), [#25](https://github.com/rajudandigam/agent-inspect/issues/25) | — |

**Maintainer scripts (review before apply):**

```bash
DRY_RUN=1 ./scripts/github-milestones-v3-oss.sh
DRY_RUN=1 ./scripts/update-existing-issues-v3-oss.sh
DRY_RUN=1 ./scripts/close-stale-issues-v3-oss.sh
DRY_RUN=1 ./scripts/create-live-issues-batch-03.sh
# GH_APPLY=1 ...  (maintainer only)
```

---

## Shipped (do not reopen)

| Issue | Shipped as |
| ----- | ---------- |
| [#8](https://github.com/rajudandigam/agent-inspect/issues/8) | Diff CLI examples (closed) |
| [#20](https://github.com/rajudandigam/agent-inspect/issues/20) | [docs/INSTALL-SMOKE-TEST.md](docs/INSTALL-SMOKE-TEST.md) |
| [#21](https://github.com/rajudandigam/agent-inspect/issues/21) | [examples/recipes/winston-json-logs/](examples/recipes/winston-json-logs/) |
| [#26](https://github.com/rajudandigam/agent-inspect/issues/26) | [docs/SAFE-TRACE-SHARING.md](docs/SAFE-TRACE-SHARING.md) |

**Pending maintainer close (superseded by v3.x):** [#11](https://github.com/rajudandigam/agent-inspect/issues/11) timeline, [#12](https://github.com/rajudandigam/agent-inspect/issues/12) stats, [#14](https://github.com/rajudandigam/agent-inspect/issues/14) LangChain streaming design, [#23](https://github.com/rajudandigam/agent-inspect/issues/23) AI SDK manual recipe, [#24](https://github.com/rajudandigam/agent-inspect/issues/24) CI artifact recipe, [#30](https://github.com/rajudandigam/agent-inspect/issues/30) AI SDK design note — see [ISSUE-HYGIENE-PLAN.md](docs/community/ISSUE-HYGIENE-PLAN.md).

---

## Good first issues (live)

| Issue | Title | Lane |
| ----- | ----- | ---- |
| [#7](https://github.com/rajudandigam/agent-inspect/issues/7) | OpenInference export fixture (v3 schema) | Standards |
| [#9](https://github.com/rajudandigam/agent-inspect/issues/9) | AgentInspect vs production observability comparison | OSS Hygiene |
| [#10](https://github.com/rajudandigam/agent-inspect/issues/10) | Retry / circuit-breaker fixture pack | Examples |
| [#18](https://github.com/rajudandigam/agent-inspect/issues/18) | First PR walkthrough (v3) | OSS Hygiene |
| [#19](https://github.com/rajudandigam/agent-inspect/issues/19) | Update contributor docs with live v3 links | OSS Hygiene |
| [#27](https://github.com/rajudandigam/agent-inspect/issues/27) | Log ingest config cookbook | Examples |

**Skills:** Markdown, TypeScript examples, fixtures/recipes patterns.

---

## Intermediate (live)

Comment on the issue before substantial work.

| Issue | Title | Lane |
| ----- | ----- | ---- |
| [#13](https://github.com/rajudandigam/agent-inspect/issues/13) | Decision metadata recipe | Examples |
| [#22](https://github.com/rajudandigam/agent-inspect/issues/22) | MCP tool-call trace fixture *(recipe exists — confirm scope)* | Examples |
| [#25](https://github.com/rajudandigam/agent-inspect/issues/25) | Phoenix/OpenInference import graduation guide | Standards |
| [#28](https://github.com/rajudandigam/agent-inspect/issues/28) | Performance / multi-run fixture pack *(reframe → #041)* | UI/Performance |
| [#29](https://github.com/rajudandigam/agent-inspect/issues/29) | LangChain persisted trace example | Examples |

---

## Maintainer-owned

Unified persisted InspectEvent model, schema evolution, redaction/security internals, package exports, official adapter internals, OTLP sink architecture, release process.

| Issue | Notes |
| ----- | ----- |
| [#14](https://github.com/rajudandigam/agent-inspect/issues/14) | LangChain streaming — **shipped 1.3.0**; pending close |
| Batch [#031](.github/LIVE_ISSUE_BATCH_03/031-align-public-roadmap-with-current-release.md) | Roadmap alignment — maintainer-reviewed |

See [docs/community/CONTRIBUTOR-ROLES.md](docs/community/CONTRIBUTOR-ROLES.md).

---

## Before you pick an issue

1. **Comment** on the live issue.
2. Read [CONTRIBUTING.md](CONTRIBUTING.md) validation commands.
3. **Redact** traces before sharing — [SAFE-TRACE-SHARING.md](docs/SAFE-TRACE-SHARING.md).
4. Do not add root runtime dependencies without approval.

See [docs/community/MONTHLY-OSS-HYGIENE.md](docs/community/MONTHLY-OSS-HYGIENE.md) · [ROADMAP.md](ROADMAP.md).
