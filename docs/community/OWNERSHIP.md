# Area ownership

How a change is routed for review, and what that does and does not mean.

This is about **which part of the tree**. For **what a person may do** — external
contributor, issue owner, triage, write, maintainer — see
[CONTRIBUTOR-ROLES.md](./CONTRIBUTOR-ROLES.md). The two are different axes: roles
say what you are allowed to own, this says who reviews it once you have.

## The three names for one fact

Every part of AgentInspect has an **area**. The area appears in three places,
and they are kept in step deliberately:

| where | form | used for |
| --- | --- | --- |
| issues | an `area:` label | finding work, and the collision rule below |
| `.github/CODEOWNERS` | a path pattern | GitHub requesting a review |
| this page | a row in the table | saying who that is, in prose |

Adding an area means adding all three. If they disagree, `CODEOWNERS` is what
GitHub acts on, and the disagreement is a bug in the other two.

## Areas

| `area:` label | paths | owner |
| --- | --- | --- |
| `area:core` | `packages/core/` | @rajudandigam |
| `area:cli` | `packages/cli/`, `packages/tui/` | @rajudandigam |
| `area:diff` | `packages/core/src/diff/` | @rajudandigam |
| `area:logs` | `packages/core/src/logs/` | @rajudandigam |
| `area:index` | `packages/index-sqlite/` | @rajudandigam |
| `area:workspace` | `packages/core/src/{bundle,evidence,gate}/` | @rajudandigam |
| `area:studio` | `packages/studio/` | @rajudandigam |
| `area:viewer` | `packages/viewer/` | @rajudandigam |
| `area:vscode` | `packages/vscode/` | @rajudandigam |
| `area:adapters` | `packages/{adapter-sdk,ai-sdk,openai-agents,langchain,vitest,jest,harness,eval,guardrails,circuit,redact}/` | @rajudandigam |
| `area:mcp` | `packages/mcp/`, `packages/mcp-server/` | @rajudandigam |
| `area:standards` | `packages/core/src/exporters/`, `fixtures/standards/` | @rajudandigam |
| `area:website` | `apps/website/` | @rajudandigam |
| `area:community` | `CONTRIBUTING.md`, `docs/community/`, the issue and PR templates | @rajudandigam |
| `area:release` | `.github/workflows/`, `scripts/`, `package.json`, the public-truth docs | @rajudandigam |

Three areas — `diff`, `logs` and `workspace` — live *inside* `packages/core/`
rather than in packages of their own. `CODEOWNERS` lists them after the
`area:core` line so the narrower pattern wins; today both resolve to the same
owner, so the ordering matters only for the day they do not.

## Every area routes to one person today

@rajudandigam is the only publicly identified maintainer, so that is the honest
mapping. It is recorded per area rather than as a single catch-all so that
adding a second owner is a one-line edit on that area's line, not a
re-derivation of which paths belong to what.

Nothing here is a claim that one person reviews everything forever. It is a
claim about who to ask **today**, which is the question a contributor waiting on
a review actually has.

## What CODEOWNERS does not do

- **It does not grant or restrict access.** Ownership is routing; permissions
  are the collaborator list, which this does not touch.
- **It does not block merges.** Requiring owner approval is a branch-protection
  setting, and it is deliberately not enabled — see below.
- **It does not mean nobody else may review.** Anyone may review anything; the
  owner is who GitHub asks, not who is allowed.

## Why review is not required for merge

Making owner review *required* on a project with one maintainer converts every
pull request into a wait on one person, including their own. The routing is
useful now; the gate would only be useful once an area has more than one owner.
That change belongs with the second owner, not before.

## `maintainer-owned` and `community-owned`

The two labels answer a different question from this page — not *who reviews it*
but *who is expected to do it*:

- **`community-owned`** — an outside contributor can take this end to end. Most
  issues are.
- **`maintainer-owned`** — needs maintainer coordination: a release, a support
  level, a public claim, or something touching credentials or infrastructure.

An issue is `maintainer-owned` because of what the work requires, not because of
which files it touches. Both kinds route to the same owner for review.

## Two agents, one area

Issues carrying the same `area:` label should not be held at the same time by
two people working in parallel. The area labels map to directories, and that is
what makes them usable as collision boundaries. An issue that genuinely needs
two areas is usually two issues.

## Adding an owner

1. Add the handle to that area's line in `.github/CODEOWNERS`.
2. Update the row in the table above.
3. Leave branch protection alone unless the intent is specifically to start
   requiring review — that is a separate decision with its own tradeoff.

## Adding an area

1. Create the `area:` label.
2. Add a section to `.github/CODEOWNERS`, after any broader pattern it narrows.
3. Add a row above.
