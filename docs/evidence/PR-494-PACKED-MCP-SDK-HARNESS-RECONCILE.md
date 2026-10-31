# PR #494 reconciliation — packed MCP real-SDK harness (chunk 07 + N1)

**Date:** 2026-10-29 (reconcile); **N1 update:** 2026-10-30
**Related:** [#488](https://github.com/rajudandigam/agent-inspect/issues/488), [#494](https://github.com/rajudandigam/agent-inspect/pull/494)  
**Contributor credit:** [@johnnylemonny](https://github.com/johnnylemonny) (Janek) — packed ESM/CJS consumer work, `wrapped.ping()` / outside-`inspectRun` warning / saved `mcp:tools/list` + `mcpServerName` coverage intent, and native Windows validation described in the PR body.

## Decision

**Do not merge PR #494.** The repository already carries a **canonical** real-`@modelcontextprotocol/sdk` packed consumer harness on `main`:

- `scripts/packed-mcp-e2e.mjs` — plain-object client, shared `inspectRun` runtime, MCP bundle externalization (no SDK in sandbox).
- `scripts/packed-mcp-sdk-e2e.mjs` — real SDK `Client`/`Server` + `InMemoryTransport`, ESM and CJS sandboxes, classification checks **M01–M14**, plus strict declaration consumers (`sdk-typecheck.mts` / `.cts`).

Both run from `pnpm pack:smoke` after `pnpm run build`. Maintainers should treat **`packed-mcp-sdk-e2e.mjs` as the single real-SDK packed harness**.

## What PR #494 contributed (retained in spirit)

| Contribution | Disposition |
|--------------|-------------|
| Proof that a **packed tarball consumer** can install the real MCP SDK and exercise `wrapMcpClient` on a true `Client` (ESM + CJS) | **Superseded** by `scripts/packed-mcp-sdk-e2e.mjs` on `main` (broader matrix). |
| **`isError: true`** tool results survive wrapping and tracing | **Retained** — shipped in product (**6.31.26**) and encoded in SDK harness **M13-tool-error-persisted**. |
| Trace linkage under active `inspectRun` (`runId`, `mcp:*` steps) | **Retained** in both mock and SDK harnesses. |
| `await wrapped.ping()` receiver-binding probe | **Retained (N1, 2026-10-30)** in M01/M02 on `packed-mcp-sdk-e2e.mjs`. |
| Zero `outside inspectRun` warnings for the intended real-SDK run | **Retained (N1, 2026-10-30)** — scoped `console.warn` capture + unconditional fail if any match. |
| Saved JSONL asserts `mcp:tools/list` + configured `mcpServerName` under the physical M01/M02 `runId` | **Retained (N1, 2026-10-30)** — reopened traces; not satisfied from in-memory `appResult` or other runs. |
| Contributor **native Windows** run | **Evidence intent retained** — rerun against **`node scripts/packed-mcp-sdk-e2e.mjs`** post-N1; matrix below stays **PENDING** until measured. |
| Mock-client regression | **Retained** in unchanged `scripts/packed-mcp-e2e.mjs` on `main`. |

## Residual real-SDK packed controls (optional follow-up)

Not blockers for closing #494; **not** claimed complete by N1:

1. **After-dispatch `AbortSignal`** — harness has pre-abort (M09) and close-based cancel (M04) only.
2. **`onprogress` callback** — unit mocks only; not end-to-end in packed SDK script.
3. **Parallel `inspectRun` overlap** — M05 overlaps concurrent calls inside a single run only.

## Commands

```bash
pnpm run build
node scripts/packed-mcp-e2e.mjs
node scripts/packed-mcp-sdk-e2e.mjs
pnpm pack:smoke
```

## Windows matrix row (post-reconcile / post-N1 — unmeasured)

| Date | OS | Node | Package managers | Packages / SDK | ESM | CJS | Command / result |
|------|----|------|------------------|----------------|-----|-----|------------------|
| PENDING | Native Windows (offered: NT 10.0.26200, X64) | PENDING (offered: `v24.22.1`) | PENDING (`pnpm 9.15.0`; `npm 12.0.2`) | PENDING pin after N1 land (do not invent PASS) | **NOT RUN** | **NOT RUN** | `pnpm run build && node scripts/packed-mcp-sdk-e2e.mjs` → **PENDING** |

Jan’s offered environment (6.31.27 / Node v24.22.1 / npm 12.0.2 / pnpm 9.15.0) is a **proposed** matrix, not a measured result. Pin mutually agreed package + harness SHA after N1 before recording PASS.

*Harness reconciliation + N1 assertion port — no merge of #494; no schema or runtime API change.*
