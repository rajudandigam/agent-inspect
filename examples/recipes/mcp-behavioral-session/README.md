# MCP behavioral-session (dual-axis outcomes)

Recipe for AgentInspect **6.26.0+** / issue **#362**.

## Lesson

MCP `isError: true` (graceful rejection) must remain TOOL `status: "error"`.
Score expected behavior with OUTCOME `outcomeStatus` (`passed` / `failed` / `unknown`).
Do not rewrite execution history to make a behavioral test pass.

## Run (synthetic)

```bash
pnpm --filter agent-inspect-recipe-mcp-behavioral-session start
```

Expected:

```text
healthy PASS
unexpected-accept FAIL
```

## CLI preset

```bash
npx agent-inspect check <run> --preset behavioral-session --json
```

Requires completed harness + outcome scoring (`--fail-on-observation failed` by default for this preset).

## External fixture (sanitized)

Maintainer-reviewed copy of the contributor gist conversion (local paths/usernames stripped):

[`fixtures/agent-inspect-manual-trace.jsonl`](./fixtures/agent-inspect-manual-trace.jsonl)

Source attribution: [gist f9e45ded12acf9c0d1577cc128090c61](https://gist.github.com/vishalhabib99/f9e45ded12acf9c0d1577cc128090c61) (@vishalhabib99) — `mcp-fuzz` session against `DeusData/codebase-memory-mcp`, converted with `outcome_observed` distinct from raw step status.

```bash
# Collapse (pre-fix shape): blanket run.status failure
npx agent-inspect check examples/recipes/mcp-behavioral-session/fixtures/agent-inspect-manual-trace.jsonl \
  --format agent-inspect-jsonl --json

# Dual-axis (6.26+): outcome verdicts without treating graceful tool errors as run failure
npx agent-inspect check examples/recipes/mcp-behavioral-session/fixtures/agent-inspect-manual-trace.jsonl \
  --format agent-inspect-jsonl --preset behavioral-session --json
```

Expected contrast: default `check` → one `run.status` finding; `--preset behavioral-session` → `run.requireCompleted` passes and findings come from `outcome.status` (21 failed observations in this fixture).
