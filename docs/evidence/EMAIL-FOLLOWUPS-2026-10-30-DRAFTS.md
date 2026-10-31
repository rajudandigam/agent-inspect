# Email follow-ups — drafts (2026-10-30 / updated after 6.31.31)

**Status:** GitHub partner notes posted for Jan (#494) and Roy (#437 / #484). Gmail send still needs maintainer authorization + a connected Gmail tool in this session (none available here).

## Jan / John — native Windows rerun (after N1) — GitHub posted

Posted on [#494](https://github.com/rajudandigam/agent-inspect/pull/494#issuecomment-6540024681) asking for a measured Windows rerun against **agent-inspect@6.31.31** / `scripts/packed-mcp-sdk-e2e.mjs`. Matrix stays **PENDING / NOT RUN**.

Optional email mirror (do not invent PASS):

```text
Subject: AgentInspect packed MCP SDK — Windows rerun after 6.31.31 N1

Hi Jan,

Thanks again for the packed real-SDK coverage and the Windows offer.

Your three checks are now in the canonical harness on agent-inspect@6.31.31:
  scripts/packed-mcp-sdk-e2e.mjs
  - await wrapped.ping()
  - zero "outside inspectRun" warnings for the intended run
  - saved JSONL asserts mcp:tools/list + mcpServerName under that runId

I also left the ask on PR #494. When you have a moment, please rerun on native Windows and reply with Node/npm/pnpm/package versions + exit status:

  pnpm run build && node scripts/packed-mcp-sdk-e2e.mjs

We will not mark the Windows matrix PASS until your measured result lands.

Thanks,
Raju
```

## Faham — existing unsent draft (hold / ready to send)

**Gmail draft already prepared:** pins **agent-inspect@6.31.28** and `node prove-same-output-wrong-path.mjs` — still a valid retest baseline.  
**Action:** send that draft when you authorize Gmail send. No independent result yet. Do not silently retarget to 6.31.31 unless Faham asks.

## Hashim — one small runnable example (draft ready)

Pin updated to **6.31.31**. Create/send via Gmail when authorized:

```text
Subject: AgentInspect — tiny TypeScript starter + one friction ask

Hi Hashim,

Thanks for the interest. If useful, here is a minimal local loop (Node >=20):

  npm i agent-inspect@6.31.31
  # then in a .mjs / .ts file:

  import { inspectRun, step } from "agent-inspect";

  await inspectRun("hashim-starter", async () => {
    await step("tool:echo", async () => ({ ok: true }), { type: "tool" });
  }, { traceDir: ".agent-inspect-runs" });

  # inspect the JSONL under .agent-inspect-runs/

If you try it, what is the single most annoying friction point
(install, types, docs, or the first trace)? Even one sentence helps.

Thanks,
Raju
```

## Roy / Uduak / Robb

- Roy: GitHub notes posted — [#437 UNPROVABLE fixtures](https://github.com/rajudandigam/agent-inspect/issues/437#issuecomment-6540024813), [#484 path-scrubbed -003](https://github.com/rajudandigam/agent-inspect/issues/484#issuecomment-6540024992). Acceptance still pending.
- Uduak / Robb: replacement Sent earlier; receipt unconfirmed — no chase unless asked.
