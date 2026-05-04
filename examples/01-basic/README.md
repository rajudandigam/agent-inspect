# Example 01 — Basic `inspectRun` + `step`

## What it demonstrates

The smallest useful pattern: one `inspectRun` names the overall run, and each `step()` becomes a child in the trace with timing. You get a tree you can reopen with the CLI instead of ephemeral logs.

## Run

From the **repository root**, build once (so `agent-inspect` resolves to `dist/`):

```bash
pnpm build
```

Then in this folder:

```bash
pnpm install
pnpm start
```

By default you will see **terminal** progress from AgentInspect (runs and steps). For a quiet run:

```bash
AGENT_INSPECT_SILENT=true pnpm start
```

## Inspect traces

From the repo root:

```bash
node packages/cli/dist/index.cjs list
node packages/cli/dist/index.cjs view <run-id>
```

Or, with the CLI on your `PATH`:

```bash
agent-inspect list
agent-inspect view <run-id>
```

## Expected output shape

- **Terminal:** run header, step lines with durations, trace path.
- **JSONL:** `run_started` → `step_started` / `step_completed` pairs → `run_completed`, all with matching `runId`.
