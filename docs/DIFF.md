## Diff / compare

AgentInspect can compare two runs (manual traces) locally and render a diff summary.

- **CLI usage**: `docs/CLI.md` (`diff`)
- **Schema expectations for diff inputs**: `docs/SCHEMA.md` (manual trace JSONL, `schemaVersion: "0.1"`)

Notes:
- Programmatic diff APIs are documented as **experimental** in `docs/API.md`.
- `diff` is read-only and does **not** rerun agents; “differences” do not necessarily imply failure (command errors do).
- `diff` reads local trace files only. It is useful for local debugging, but it is not production APM or hosted observability.

## CLI examples

The examples below use the checked-in fixture traces, so they are safe to copy and run locally:

```bash
agent-inspect diff minimal-success minimal-error --dir fixtures/traces
agent-inspect diff minimal-success long-running --dir fixtures/traces --check timing --duration-threshold 1ms
agent-inspect diff minimal-success nested-3-levels --dir fixtures/traces --check structure --ignore-duration
```

If you are running from a source checkout before installing the package globally, use the built CLI path instead:

```bash
node packages/cli/dist/index.cjs diff minimal-success minimal-error --dir fixtures/traces
```

### Success run vs error run

This compares a successful run with a run that ended in an error. It shows the run status change, a duration difference, and the step-level structure difference (`plan` removed, `failing-step` added).

**Simplified example output** (actual CLI formatting may differ slightly):

```text
Run diff
Left:  minimal-success
Right: minimal-error

Summary:
  Differences: 4
  Errors: 0
  Warnings: 3
  Info: 1

First divergence:
  run-status at (run)
    left: success
    right: error

Differences:
  [warning] run-status
    Run completion status differs
    left: success
    right: error
  [info] duration
    Run duration differs
    left: 120
    right: 70
  [warning] step-removed plan
    Step only in left run: plan
    left: step_root
    right: (undefined)
  [warning] step-added failing-step
    Step only in right run: failing-step
    left: (undefined)
    right: step_fail
```

### Duration-only timing check

Use `--check timing` when you only want timing differences. `--duration-threshold` can hide tiny deltas.

```bash
agent-inspect diff minimal-success long-running --dir fixtures/traces --check timing --duration-threshold 1ms
```

**Simplified example output**:

```text
Run diff
Left:  minimal-success
Right: long-running

Summary:
  Differences: 1
  Errors: 0
  Warnings: 0
  Info: 1

First divergence:
  duration at (run)
    left: 120
    right: 45

Differences:
  [info] duration
    Run duration differs
    left: 120
    right: 45
```

### Step structure / rename-style changes

When a prompt, model, or routing change renames or restructures steps, the current diff output represents that as `step-removed` plus `step-added`. Use `--ignore-duration` if the structure is what matters.

```bash
agent-inspect diff minimal-success nested-3-levels --dir fixtures/traces --check structure --ignore-duration
```

**Simplified example output**:

```text
Run diff
Left:  minimal-success
Right: nested-3-levels

Summary:
  Differences: 2
  Errors: 0
  Warnings: 2
  Info: 0

First divergence:
  step-removed at plan
    left: step_root
    right: (undefined)

Differences:
  [warning] step-removed plan
    Step only in left run: plan
    left: step_root
    right: (undefined)
  [warning] step-added outer
    Step only in right run: outer
    left: (undefined)
    right: step_outer
```
