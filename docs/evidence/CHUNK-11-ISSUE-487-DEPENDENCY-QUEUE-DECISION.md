# CHUNK 11 — Security / dependency queue (#487; PRs #496 / #506 / #444 / #500 / #501)

**Date:** 2026-10-29  
**Starting commit:** `cb74e6b1` (main, clean worktree)  
**Mode:** Read-only review + decision note (no lockfile edits this turn)

## Scope

Issue [#487](https://github.com/rajudandigam/agent-inspect/issues/487) tracks **private Promptfoo reviewer-kit** advisory exposure and compatible remediation paths. The queued Dependabot PRs are **related supply-chain hygiene**, not a substitute for #487 acceptance.

## Published runtime vs private / tooling

| Surface | Lock / manifest | Ships on npm `agent-inspect`? | Notes |
| --- | --- | --- | --- |
| **Published runtime** | Root + `@agent-inspect/core` `package.json`: `chalk`, `nanoid`, `commander` only | **Yes** | No Promptfoo, no MCP SDK, no website stack in the published tarball graph |
| **Monorepo workspace** | Root `pnpm-lock.yaml` | No (dev/examples/apps) | `pnpm audit` reports **112** advisory instances (4 critical / 47 high / 53 moderate / 8 low) — dominated by optional recipes, `apps/website`, and dev tooling |
| **Promptfoo recipe** | `examples/recipes/promptfoo-use-together/package.json` (`promptfoo@0.118.17`) | No | Opt-in example; not root runtime |
| **Private reviewer kit** | `examples/reviewer-kits/promptfoo-trajectory/package-lock.json` (`promptfoo@0.118.17`, npm lock) | No | #487 primary scope; separate install (`npm ci` in kit dir) |
| **CI** | `.github/workflows/*.yml` action SHAs (v4 pins) | No | GitHub-hosted runner only |

#487 explicitly does **not** assert a published-runtime exploit. Monorepo audit noise must not be read as npm install risk for default `agent-inspect` consumers.

### Private kit audit snapshot (2026-10-29)

From `examples/reviewer-kits/promptfoo-trajectory`:

```bash
cd examples/reviewer-kits/promptfoo-trajectory && npm audit --audit-level=moderate
```

Notable paths (aligned with #487 body):

- `promptfoo → … → basic-ftp` — GHSA-c475-qrg2-pj4r; npm suggests fix via **promptfoo@0.125.1** (`npm audit fix --force`), which is a **major Promptfoo jump** and forbidden shortcut per #487.
- `@modelcontextprotocol/sdk`, `@azure/msal-node`, `@hono/node-server` — high/moderate; transitive via Promptfoo / provider stack, not AgentInspect core.

## Dependabot PR states (2026-10-29)

| PR | Title | State | CI | Merge recommendation this turn |
| --- | --- | --- | --- | --- |
| [#496](https://github.com/rajudandigam/agent-inspect/pull/496) | production-deps group (18 packages) | OPEN | **FAIL** typecheck + website; unit/size skipped | **Do not merge.** Bundles breaking majors (`chalk@6` Node 22+, `nanoid@6` drops Node 18/20, `commander@15` ESM-only, `ai@7`, `next@16`, `ink@8`, `promptfoo@0.125.1`, etc.) — incompatible with `engines.node >=20` and recipe pins in one shot. |
| [#506](https://github.com/rajudandigam/agent-inspect/pull/506) | development-deps group (14 packages) | OPEN | **FAIL** typecheck + website + Vercel | **Do not merge.** Same “group bump” blast radius; fails CI. |
| [#444](https://github.com/rajudandigam/agent-inspect/pull/444) | `actions/checkout` 4 → 7 | OPEN | **All green** (incl. unit/size) | **CI-only slice** — safe to merge in a **separate** maintainer PR train; **not** #487 Promptfoo remediation. |
| [#500](https://github.com/rajudandigam/agent-inspect/pull/500) | `actions/upload-artifact` 4 → 7 | OPEN | **All green** | Same as #444. |
| [#501](https://github.com/rajudandigam/agent-inspect/pull/501) | `actions/setup-node` 4 → 7 | OPEN | **All green** | Same as #444. |

`dependency-review` passed on all five PRs; that gate only blocks **new** high/critical introductions on the PR diff — it does not certify breaking upgrades or kit compatibility.

## Recommended dependency slice this turn

**None implemented.** No single narrow pin in the root lockfile safely advances #487 without:

1. A **Promptfoo compatibility matrix** (exact-answer / failure matrix, kit↔recipe parity, two CLI invocations, exit codes) per #487 acceptance — not done in this read-only chunk.
2. Avoiding `npm audit fix --force` and avoiding #496’s monolithic production group.

### Deferred slices (maintainer-owned, ordered)

1. **#487 dedicated train:** Evaluate `promptfoo@0.125.x` (or newer parent that pulls `basic-ftp@>=6.2.1` within semver) in **both** `promptfoo-use-together` and `promptfoo-trajectory`, refresh locks, run kit acceptance commands, document residual forge/braces exposure.
2. **GitHub Actions v7:** Merge #444 / #500 / #501 (or one combined maintainer PR with updated SHAs + `pnpm actions:check`) — low runtime risk, full CI already green.
3. **Published runtime:** Stay on `chalk@5`, `nanoid@5`, `commander@12` until a **semver-compatible** patch/minor advisory fix exists; reject #496 majors until Node/engine policy explicitly moves to 22+.

## Explicit non-actions

- Did **not** run `npm audit fix` / `pnpm audit --fix` on root or kit locks.
- Did **not** merge or update Dependabot PRs.
- Did **not** add root runtime dependencies.

## References

- [docs/SECURITY-SCANNERS.md](../SECURITY-SCANNERS.md) — published vs optional adapter graphs
- Issue #487 acceptance criteria (private kit inventory, compatible Promptfoo upgrade, no emergency npm release)
