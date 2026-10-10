# Recipe: browser-mcp-observed-outcomes

## What this demonstrates

A synthetic Browser/MCP-style harness separates **tool-reported success** from
**observed effect**, with explicit resource binding and preconditions.

Observer identity comes from the **resource object actually read**, not from a
caller-supplied label. Assertions are collected independently so a known binding
failure is retained when the observation window is incomplete.

Acceptance matrix (all synthetic / in-memory):

| Case | Expected |
| --- | --- |
| Intended tab A, observer A, cart→checkout, complete window | `passed` |
| Intended A, observer watches B; B also cart→checkout | `failed` **only** on resource binding; precondition/postcondition pass |
| Same wrong-tab case with test-only binding ablation | `passed` (proves binding check is necessary; not a production bypass) |
| Caller forges label A while observer object is B | `failed` (binding) |
| Wrong binding B + incomplete window | binding `failed` **and** postcondition `unknown` |
| No observer / incomplete without a known violation | `unknown` — never fabricated absence |
| Tool success but observed state unchanged | `failed` (postcondition) |

Also includes Om's synthetic a1→a2 attempt comparison (`retryOf`, locator facts)
and URL redaction controls (query token, userinfo, identifier-bearing path).
Safe route templates such as `/orders/:id` are preferred over stripping query
params alone.

**Credit:** resource-binding counterexample context from achiya-automation
(permitted contribution).

The observer is injected in-process. This does **not** prove an independent
browser channel, Safari delivery, or real MCP transport.

## How to run

```bash
pnpm build
pnpm --filter agent-inspect-recipe-browser-mcp-observed-outcomes start
```

## Expected output

See `expected-output.txt` for the matrix gates, ablation line, Om comparison,
and redaction controls.
