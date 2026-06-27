# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-1-redaction-package-rfc-and-boundary"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-0-post-v2-reconciliation-and-v2.1-planning"
```

## Goal

Define the `@agent-inspect/redact` package boundary before runtime package work begins.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
- existing redaction-related docs and source only as needed for boundary accuracy

## Prior chunk evidence

- Starting commit: `904c437475e7ba0da8a844128488d3f2b5be76b1`.
- `git pull --ff-only origin main` fast-forwarded the worktree to the supplemental v2-to-v3 planning kit.
- v2.0 publication state was reconciled before opening v2.1:
  - `npm view agent-inspect version` -> `2.0.0`
  - `npm view @agent-inspect/ai-sdk version` -> `2.0.0`
  - `npm view @agent-inspect/langchain version` -> `2.0.0`
  - `npm view @agent-inspect/tui version` -> `2.0.0`
  - `npm view @agent-inspect/openai-agents version` -> `2.0.0`
  - `git ls-remote --tags origin 'agent-inspect@2.0.0^{}'` -> `0533c3377b2079cc76b85bf41ff9e8832a26f012`
- Public and implementation roadmap pointers were reconciled to the v2.1-to-v3 sequence.
- Historical v1.x and v2.0 release evidence was preserved.

## In scope

1. Create or update `docs/proposals/REDACT-PACKAGE.md`.
2. Define the `@agent-inspect/redact` package boundary, profile semantics, detector model, finding shape, and CLI/API design.
3. Explain how the package can be reused without AgentInspect tracing.
4. Document that the same engine should later power trace writing, export, verify-safe, explain, and CI artifacts.
5. Keep the design deterministic, local-first, and free of compliance claims.

## Out of scope

- runtime redaction package implementation;
- package versions, changesets, publishing, or tags;
- root/core dependency additions;
- schema changes;
- network/provider behavior;
- LLM judge behavior;
- compliance guarantees;
- changes to trace writing behavior.

## Focused validation

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Acceptance criteria

- The redact package boundary is explicit enough for implementation chunks.
- No runtime code, exports, package manifests, package versions, changesets, tags, or publishing state changes are made in the RFC chunk.
- The proposal preserves local-first, deterministic, safe-by-default behavior.
- The proposal does not introduce compliance claims, default prompt/output capture, raw chain-of-thought capture, or network behavior.

## Proposed commit

```text
docs: define redact package boundary
```

## Next chunk

`v2.1-2-redact-package-scaffold-and-core-engine-extraction`.

## Stop condition

Stop on unrelated worktree changes, material roadmap conflict, schema/dependency/network decisions, package publication gates, or validation failure that cannot be repaired inside docs/process scope.
