# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-2-redact-package-scaffold-and-core-engine-extraction"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-1-redaction-package-rfc-and-boundary"
```

## Goal

Create the optional `@agent-inspect/redact` package and extract/share the existing redaction engine without breaking current trace safety behavior.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
- `docs/proposals/REDACT-PACKAGE.md`
- existing core redaction implementation and tests

## Prior chunk evidence

- Starting commit: `1c88d91295fab0c7a473acedf48bf6605fcc669f`.
- Created `docs/proposals/REDACT-PACKAGE.md`.
- Added the redaction package proposal to `docs/proposals/README.md`.
- Clarified the v2.1 execution-plan scope for the proposal index update.
- Defined the package boundary, API shape, profile semantics, detector model, finding shape, CLI design, integration plan, test strategy, and non-goals.
- No runtime source, package manifests, package versions, changesets, tags, or publishing state were changed in the RFC chunk.

## In scope

1. Add `packages/redact/package.json`.
2. Add ESM/CJS/types build configuration consistent with optional public packages.
3. Add initial public API:
   - `redact`
   - `createRedactor`
   - `createRedactionProfile`
   - `RedactionFinding`
   - `RedactionProfile`
4. Reuse or extract existing core redaction logic while preserving root/core behavior.
5. Keep root dependencies unchanged.
6. Add focused package tests and smoke support as required by the active plan.

## Out of scope

- detector expansion beyond behavior-preserving scaffold unless required by the plan chunk;
- changesets, package version changes, publishing, or tags;
- root/core dependency additions;
- schema changes;
- network/provider behavior;
- LLM judge behavior;
- compliance guarantees;
- behavior changes to existing trace writing/export/report redaction unless explicitly tested and documented.

## Focused validation

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Acceptance criteria

- `@agent-inspect/redact` has a clear optional package scaffold and initial API.
- Existing trace safety behavior remains compatible.
- Root/core runtime dependencies do not increase.
- ESM, CJS, and declaration outputs are valid for the new package.
- Package smoke covers the new public package as appropriate.
- No network behavior or compliance claims are added.

## Proposed commit

```text
feat(redact): add reusable redaction package
```

## Next chunk

`v2.1-3-redaction-detectors-findings-and-profiles`.

## Stop condition

Stop on unrelated worktree changes, root/core dependency decisions, schema decisions, package publication gates, network behavior, public breaking changes, or validation failure that cannot be repaired inside the scaffold scope.
