# Browser/MCP observed outcomes: vocabulary, rendering, and recipe plan

- **Status:** Draft (proposal only)
- **Baseline:** 6.7.2 (adoption freeze)
- **Related issue:** [#113](https://github.com/rajudandigam/agent-inspect/issues/113)
- **Related docs:** `examples/recipes/observed-outcome-basic/`, [TRACE-CHECKS.md](./TRACE-CHECKS.md)

## Summary

Issue #113 asks AgentInspect to preserve the distinction between "tool returned successfully" and "the expected world-state change was independently observed", with browser/MCP automation as the motivating case (a tool can report success while the page state does not change). The maintainer note scopes this to design review of the existing surface, not a greenfield API: `observeOutcome()` / `outcome_observed` already ship.

This document maps the shape proposed in #113 onto the shipped surface field by field, identifies the two real gaps (a closed `method` vocabulary and missing rendering in the execution tree), proposes browser/MCP naming and evidence conventions that need no schema change, and sketches the follow-up recipe. Proposal only: no runtime, schema, or Safari MCP changes.

## Shipped surface (6.7.2)

`observeOutcome(name, { expectation, status, method?, actual?, evidence?, observedAt? })` writes an `outcome_observed` event bound to the active run (optionally a parent step via `parentId`). Statuses are exactly the four the issue proposes: `passed`, `failed`, `unknown`, `skipped`. `name` is bounded to 100 chars, `expectation` to 500; `actual` and `evidence` go through the standard metadata bounds and redaction profiles.

Field-by-field, the #113 proposed shape is already expressible:

| #113 field | Shipped equivalent | Notes |
| --- | --- | --- |
| `name` | `name` (first argument) | same intent, bounded |
| `expectation` | `options.expectation` | required, bounded |
| `status` | `options.status` | identical vocabulary |
| `method` | `options.method` | **closed enum today — see gap 1** |
| `observedAt` | `options.observedAt` | number or ISO string accepted |
| `actual` | `options.actual` | bounded payload |
| `evidence` | `options.evidence` | bounded payload; reference ids fit here |

Where outcomes already surface:

- `report` — dedicated observed-outcomes section (`--section observations`), markdown/HTML table of name/status/expectation/method.
- `check` — `createObservedOutcomeRule` (`outcome.status`, experimental v4.4+) and CLI `--fail-on-observation <status>`.
- `search` — `--observation <status>` filter.
- `suite` — `--require-observation <name>` for required passed observations.
- Bundles — outcomes travel with the trace through share-safety redaction.

## Gap 1: `method` is a closed vocabulary

#113 says `method` "should not be a closed enum too early" and lists `pixel_diff` as an initial example. Today `method` is a hard enum (`dom`, `accessibility`, `snapshot`, `network`, `storage`, `filesystem`, `database`, `queue`, `custom`) and an unrecognized value throws `Unsupported observation method` at runtime — so `pixel_diff` is not recordable as such.

Options considered:

1. **Open the vocabulary** (accept any bounded lowercase token). Cleanest match for the issue's intent, but it is a runtime behavior change (previously-throwing inputs start persisting) and loosens a persisted-format guarantee, so it does not belong in the freeze.
2. **Extend the enum** with `pixel_diff` (and future one-offs). Still closed, and invites churn per new automation technique.
3. **Document a `custom` + detail convention now; revisit opening the vocabulary at the next scheduled minor.** Under the freeze, browser/MCP methods outside the enum use `method: "custom"` and carry the specific technique in `actual.methodDetail` (e.g. `"pixel_diff"`). No runtime change, nothing lost from the trace, and a later vocabulary opening can promote `methodDetail` values without breaking old traces.

**Recommendation: option 3 now, option 1 as the post-freeze follow-up.** If maintainers prefer option 1 immediately, the change is contained (`parseMethod` in `packages/core/src/outcomes/validate.ts` plus type widening) but needs a decision on validation of arbitrary tokens.

## Gap 2: failed outcomes are invisible in the tree

The issue's rendering goal is that "a failed observed outcome should not be hidden behind a green tool call". Today it is:

| Surface | Observed outcomes today |
| --- | --- |
| `report` | rendered (summary + table; `actual` omitted from the table) |
| `check` | enforced via `outcome.status` rule |
| `search` | filterable by status |
| `view` | **not rendered at all** |
| `what` | **not summarized** (its "Outcome:" line is the run outcome, a different concept) |

Concrete follow-ups (each freeze-deferrable, listed for sequencing):

1. `view`: render `outcome_observed` events under their parent step with status marker, so a green `tool:` line shows its failed observation directly beneath.
2. `what`: add an observed-outcomes count line (`observed: 3 passed, 1 failed`) when outcomes exist.
3. `report`: include `actual` (bounded, stringified) in the observations table, since "returned vs observed" needs the observed side visible.

## Browser/MCP conventions (no schema change)

For the snapshot → action → snapshot pattern (Safari MCP and similar):

- **Names** are short machine-readable expectations, as in the issue: `tab-url-changed`, `element-visible`, `native-click-delivered`, `network-request-seen`, `form-state-updated`.
- **Evidence carries references, never captures:** `{ beforeSnapshotId, afterSnapshotId }`, network capture ids, screenshot ids, artifact paths. Ids are references into the automation tool's own store; hash or alias them if they are sensitive in a deployment. No page content, DOM serializations, or screenshots inline by default (matches the issue's non-goals and keeps bundles share-safe).
- **`actual` states what was checked:** small booleans/counts (`{ requestSeen: false, urlChanged: false }`), plus `methodDetail` when `method: "custom"` is used per gap 1.
- **Status semantics:** `unknown` when the check could not run (snapshot unavailable), `skipped` when deliberately not checked. Tools should not report `passed` merely because the action call returned.
- **Attachment:** record the outcome with the acting step as `parentId` so the pairing survives into rendering follow-up 1.

## Follow-up recipe

`examples/recipes/browser-mcp-observed-outcomes/` (separate issue once this doc is agreed): a deterministic, local-only mock of the snapshot → action → snapshot flow. A `tool:native-click` step returns success; the verification step records `observeOutcome("native-click-delivered", { status: "failed", method: "snapshot", actual: { urlChanged: false }, evidence: { beforeSnapshotId, afterSnapshotId } })`. README walks `report --section observations`, `search --observation failed`, and `check --fail-on-observation failed` so the reviewer sees a red observation on a green tool call. No browser, MCP, or network dependency — same synthetic pattern as `observed-outcome-basic`.

## Non-goals

Carried from #113: no formal-verification claims, no per-framework UI automation understanding, no DOM-only bias, no Safari MCP dependency or required Safari MCP changes, no trace mutation, no screenshot/page-data capture by default.

## Open questions

1. Should the `method` vocabulary open fully (any bounded token) or grow case by case? This doc leans open-at-next-minor with `custom` + `methodDetail` in the interim.
2. Should `view` rendering of outcomes be opt-in (flag) or default once implemented? Leaning default: an invisible failed observation is the exact failure mode the issue describes.
3. Is `actual.methodDetail` the right interim home for the technique name, or should it live in `evidence`? Leaning `actual` (it describes how the observation was made, not a reference to external evidence).
