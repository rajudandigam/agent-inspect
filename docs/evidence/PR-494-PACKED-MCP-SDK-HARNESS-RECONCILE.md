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
| Contributor **native Windows** run | **Measured (2026-10-31)** — rerun against canonical **`scripts/packed-mcp-sdk-e2e.mjs`** post-N1 on native Windows 11 (Node `v26.13.0`); all assertions M01–M14 + `.mts`/`.cts` PASS. |
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

## Windows matrix row (post-reconcile / post-N1 — measured)

| Date | OS | Node | Package managers | Packages / SDK | ESM | CJS | Command / result |
|------|----|------|------------------|----------------|-----|-----|------------------|
| 2026-10-31 | Native Windows 11 (NT 10.0.26300, X64) | `v26.13.0` | `pnpm 12.16.1`; `npm 12.2.1` | `agent-inspect@6.31.33` + `@agent-inspect/mcp@6.31.33` (pin `@modelcontextprotocol/sdk@1.31.0`) | **PASS** | **PASS** | `pnpm run build && node scripts/packed-mcp-sdk-e2e.mjs` → **PASS** (commit `8b5cb4ad`; M01–M14 + `.mts`/`.cts`) |

Measured on native Windows 11 against canonical `scripts/packed-mcp-sdk-e2e.mjs` at commit `8b5cb4ad` (release `6.31.33`). Verified real SDK client operations in both ESM and CJS sandboxes: M01b zero-outside-warnings, M01/M02 real-client probe and `wrapped.ping()`, M01c saved JSONL tool list and server name, M07 error preservation, M13 tool-error persistence, M08 bounded close, M03 retry boundary, M04 cancellation on close, M05 distinct request IDs under overlap, M06 readiness, M09–M12 options forwarding/metadata composition, M13 malformed result handling, M14 instrumentation isolation, plus strict TypeScript declaration consumers (`.mts` and `.cts`).

*Harness reconciliation + N1 assertion port — no merge of #494; no schema or runtime API change.*
