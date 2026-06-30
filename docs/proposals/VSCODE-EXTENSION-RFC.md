# VS Code extension RFC

**Status:** accepted for v3.3 MVP  
**Package:** `packages/vscode` (`agent-inspect-vscode`)

## Goal

Thin, read-only IDE surface that reuses the existing `agent-inspect` CLI. No hosted sync, uploads, telemetry, replay, or trace mutation.

## MVP scope

1. Trace directory detection (`.agent-inspect`, `.agent-inspect-runs`, `AGENT_INSPECT_TRACE_DIR`)
2. Sidebar trace explorer (runs via `agent-inspect list --json`)
3. Commands: view tree/timeline/report/check, verify-safe, doctor, refresh, open trace directory
4. Editor context command when a run id appears in the active file

## Non-goals (v3.3)

- Marketplace automation in CI (manual first publish gate)
- Bundling `agent-inspect` core into the VSIX
- CodeLens provider (deferred; editor context command only)
- Write/mutate flows

## Publication

VS Code Marketplace first publish requires maintainer credentials — **manual gate** (deferred; extension ships in-repo). npm linked releases are unaffected.
