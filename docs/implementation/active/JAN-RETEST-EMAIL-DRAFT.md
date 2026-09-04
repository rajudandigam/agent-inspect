# Jan retest email draft (6.17.7)

**Status:** Draft only — user sends. Do not auto-send.

**To:** Jan  
**Subject:** AgentInspect 6.17.7 — retest search filters + observe / forbid-tool DX

---

Hi Jan,

AgentInspect **6.17.7** is published. Could you retest on your Win11 / Node 24 / pnpm 11 setup?

### 1) Search conjunctive filters (#323)

Please confirm that combining `--name` and `--status` returns **no false positives**:

```bash
npx agent-inspect@6.17.7 search --dir <your-trace-dir> --name <non-matching-name> --status <status-that-would-otherwise-match>
```

Expected: empty result set (`[]` / no matching runs). A status-only hit must not bypass a non-matching name.

### 2) Observe docs truth

`observe()` records only the top-level `run` / `execute` / `invoke` boundary (`run_started` / `run_completed`). It does **not** invent nested `step_*` events inside the method body. Use `step()` / adapters when you need an internal tree.

### 3) Check forbid-tool alias

```bash
npx agent-inspect@6.17.7 check <trace> --forbid-tool <toolName>
npx agent-inspect@6.17.7 check <trace> --forbidden-tool <toolName>
```

Expected: both spellings behave identically (same findings).

Thanks — reply with pass/fail notes and any unexpected output.

— Raju
