## Summary

<!-- What does this PR change and why? -->

**Linked issue (required):** #

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] Documentation only
- [ ] Example / recipe / fixture
- [ ] Test / regression coverage
- [ ] Feature or enhancement (scoped)
- [ ] Breaking change (requires major version plan — maintainer approval required)

## Reproduction / evidence

<!-- For bug fixes: how the bug reproduces and how this PR was verified against it.
     For tests/fixtures: what regression the coverage locks in. -->

## Product boundaries (check all that apply)

- [ ] Local-first only — no network upload added
- [ ] No new vendor sinks
- [ ] No SaaS / dashboard scope added
- [ ] Persisted schema compatibility preserved (`schemaVersion` 0.1/0.2/1.0 traces stay readable)
- [ ] No `step_failed` event introduced
- [ ] `inspectRun` default tracing behavior unchanged
- [ ] Redaction, size bounds, and privacy defaults not weakened

## Packages touched

- [ ] `agent-inspect` (root: core + CLI, published)
- [ ] Framework adapters: `@agent-inspect/ai-sdk` / `openai-agents` / `langchain` / `mcp` / `adapter-sdk`
- [ ] Test reporters and gates: `@agent-inspect/vitest` / `jest` / `eval` / `guardrails` / `circuit` / `harness`
- [ ] Inspection surfaces: `@agent-inspect/viewer` / `tui` / `studio` / `mcp-server` / `index-sqlite` / `redact`
- [ ] Private workspace internals (`packages/core`, `packages/cli` — ships via root `agent-inspect`)
- [ ] Docs / fixtures / recipes / community only

## Validation

<!-- Paste the commands you ran and their results -->

```bash
pnpm typecheck
pnpm test
# focused suites while iterating:
pnpm exec vitest run <relevant-test-files>
# docs changes:
pnpm docs:check
# fixtures / recipes:
pnpm fixtures:check
pnpm recipes:check
# package/export surface changes:
pnpm pack:smoke
```

## Data safety

- [ ] Synthetic data only — no real prompts, logs, tokens, or PII (fixture tokens use `sk_test_fake` / `Bearer fake-token` shapes)
- [ ] Trace/log samples in the PR were redacted or generated from fixtures

## Release hygiene

- [ ] No version bumps and **no Changesets** — maintainers own Changesets and releases
- [ ] No new runtime dependencies without prior maintainer approval (root stays `chalk`, `commander`, `nanoid` only)
- [ ] No publish, tag, or workflow changes

## Checklist

- [ ] Linked issue explains the why (comment on the issue before large PRs)
- [ ] Tests added or updated for behavior changes
- [ ] Docs updated when behavior or public API changes (`docs/API.md`, `docs/CLI.md`, `README.md`)
- [ ] `git diff --check` clean
