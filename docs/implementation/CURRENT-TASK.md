# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-8-eval-redact-recipes-and-documentation"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-7-eval-grounding-heuristics-and-cli"
```

## Goal

Make the v2.1 utility triangle visible through adoption docs and deterministic recipes:

```text
trace -> eval -> redact/share/report/artifact
```

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
- `docs/proposals/REDACT-PACKAGE.md`
- `docs/proposals/EVAL-PACKAGE.md`
- relevant recipe and documentation patterns

## Prior chunk evidence

- Starting commit: `c35de342099262d656ee1fde1a505e0e8d97acc1`.
- Added deterministic grounding heuristics to `@agent-inspect/eval`:
  - context overlap;
  - quote overlap;
  - citation presence;
  - required source IDs;
  - answer length bounds;
  - banned unsupported phrases.
- Added root CLI workflow:
  - `agent-inspect eval trace.jsonl --require-success`;
  - `agent-inspect eval trace.jsonl --forbid-tool deleteAccount`;
  - JSON and Markdown output;
  - deterministic exit codes;
  - JSON/JS/MJS/CJS config loading;
  - explicit TypeScript config rejection until a supported loader exists.
- Added CLI and eval tests for JSON output, Markdown output, failed eval exit code, unreadable diagnostics, and no-network behavior.

## In scope

1. Update adoption docs:
   - `README.md`;
   - `docs/GETTING-STARTED.md`;
   - `docs/API.md`;
   - `docs/CLI.md`;
   - `docs/SAFE-TRACE-SHARING.md`;
   - `docs/COMPARE.md`;
   - `docs/ADAPTERS.md`;
   - `docs/LIMITATIONS.md`;
   - `docs/KNOWN-ISSUES.md`;
   - `docs/implementation/ROADMAP-V2.1-TO-V3.md`.
2. Add deterministic recipes:
   - `examples/recipes/eval-local-checks`;
   - `examples/recipes/redact-share-safe-file`;
   - `examples/recipes/eval-ci-artifacts`.
3. Keep examples local-only, deterministic, and secret-free.
4. Make safe-sharing language visible.

## Out of scope

- package version changes, changesets, publishing, or tags;
- runtime source changes;
- schema changes;
- new dependencies;
- live model calls, provider judging, or network behavior;
- adapter implementation;
- v3 extensibility implementation.

## Focused validation

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
pnpm recipes:check
git diff --check
```

## Acceptance criteria

- Docs describe eval/redact/report/artifact flow without implying hosted evals or telemetry.
- Recipes use deterministic fixtures and no real API keys.
- Recipe metadata validates with the existing recipe checker.
- No package publishing, changeset, version, schema, dependency, runtime, or network change is introduced.

## Proposed commit

```text
docs: add eval and redact adoption workflows
```

## Next chunk

`v2.1-9-release-readiness`.

## Stop condition

Stop on unrelated worktree changes, package publication gates, schema/dependency/runtime decisions, live provider/network behavior, public breaking changes, or validation failure that cannot be repaired inside docs/recipes scope.
