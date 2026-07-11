# First PR walkthrough

This walkthrough shows the contributor-side flow for a small AgentInspect PR:
fork, branch, validate, and open a focused pull request against `main`.

Use this for documentation, fixture, and recipe issues from
[GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md). For deeper project rules,
start with [CONTRIBUTING.md](../../CONTRIBUTING.md).

## 1. Pick one live issue

Start from a live GitHub issue, not an archived draft file.

Good first places to look:

- [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)
- [docs/community/GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md)

Before opening a PR, leave a short comment on the issue with:

- the file or area you plan to change
- the narrow scope
- the validation you expect to run

Keep one PR tied to one issue when possible.

## 2. Fork and clone

Fork `rajudandigam/agent-inspect` on GitHub, then clone your fork:

```bash
git clone https://github.com/<your-user>/agent-inspect.git
cd agent-inspect
git remote add upstream https://github.com/rajudandigam/agent-inspect.git
git fetch upstream
```

Create a branch from the latest upstream `main`:

```bash
git switch -c docs/my-first-agent-inspect-pr upstream/main
```

Use a branch name that describes the issue, such as
`docs/first-pr-walkthrough` or `fixtures/retry-circuit-breaker`.

## 3. Install and make the change

Install dependencies once:

```bash
pnpm install
```

Choose the smallest matching path for the issue:

| PR type | Typical files | Useful validation |
| --- | --- | --- |
| Docs-only | `docs/`, `README.md`, `CONTRIBUTING.md` | `pnpm typecheck`, `pnpm test`, `pnpm docs:check` |
| Fixture | `fixtures/`, fixture docs, fixture tests | `pnpm fixtures:check`, plus relevant tests |
| Recipe | `examples/recipes/`, recipe docs | `pnpm recipes:check`, plus relevant tests |
| Test / regression | `packages/*/test/` | focused `pnpm exec vitest run <files>`, then `pnpm test` |

Do not change runtime code for a docs-only issue. If the change starts touching
package exports, schema behavior, dependency policy, redaction, or release
automation, pause and ask on the issue first.

## 4. Validate locally

For docs-only PRs, run at least:

```bash
pnpm typecheck
pnpm test
pnpm docs:check
```

For larger changes, use the relevant checks from the root
[CONTRIBUTING.md](../../CONTRIBUTING.md):

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm pack:smoke
```

For package/export surface changes, also run:

```bash
pnpm compat:smoke
npm pack --dry-run
```

If a check fails, keep the failure visible in your PR description and explain
whether it is related to the change.

## 5. Check privacy and scope

AgentInspect is local-first and safe by default. Before pushing:

- use synthetic trace data, prompts, and logs
- do not include API keys, customer logs, private prompts, or real user output
- redact trace exports before sharing
- avoid new root runtime dependencies unless a maintainer approved them
- avoid version bumps, publish steps, or changesets in drive-by PRs

## 6. Commit and push to your fork

Review the diff:

```bash
git diff
git status
```

Commit one focused change:

```bash
git add <changed-files>
git commit -m "docs: add <short description>"
git push -u origin <your-branch>
```

## 7. Open the pull request

Open the PR from your fork branch into `rajudandigam/agent-inspect:main`.

In the PR body, include:

- the issue number, for example `Closes #18`
- a short summary of the change
- validation commands and results
- any check that could not be run

Example:

```text
Summary:
- add a contributor walkthrough for fork, branch, validation, and PR flow
- link it from the existing contributor entry points

Validation:
- pnpm typecheck
- pnpm test

Closes #18
```

## Review expectations

Maintainers prefer focused PRs with clear boundaries. A good first PR should:

- solve the issue it claims
- avoid surprise runtime changes
- use existing docs tone and paths
- keep examples synthetic and safe to share
- be honest about validation

If the maintainer asks for a small wording or structure change, update the PR
in the same branch. If they ask for a larger design change, confirm the new
scope before expanding the PR.
