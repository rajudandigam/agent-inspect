# Current Codex Task

## Identity

```yaml
train: "v2.3.0"
chunk: "v2.3-4-adapter-conformance-runner-upgrade"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.3-3-langchain-langgraph-hardening"
```

## Goal

Upgrade executable adapter conformance so official adapter fixtures are reusable release evidence rather than one-off assertions.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.3.0-EXECUTION-PLAN.md`
- `docs/ADAPTER-CONFORMANCE.md`
- `docs/implementation/adapter-conformance-matrix.json`
- `packages/core/test/adapter-executable-conformance.test.ts`
- `packages/core/test/adapter-conformance-utils.ts`
- relevant official adapter tests only as needed

## Current Evidence

- v2.3 chunk 1 hardened AI SDK route-style and parallel telemetry coverage.
- v2.3 chunk 2 hardened OpenAI Agents local-only replacement mode and no-upload fixtures.
- v2.3 chunk 3 hardened LangGraph-through-LangChain metadata for graph/node identity, subgraphs, stream modes, parallel branch hints, and session/checkpoint IDs.
- Shared conformance is executable today, but the v2.3 plan calls for more reusable fixtures and release-gate evidence.

## In Scope

1. Improve the shared adapter conformance test/helper structure without adding a public registry or certification surface.
2. Add or document a compact fixture manifest if it helps release readiness.
3. Ensure official adapters continue passing lifecycle, parentage, streaming, token, redaction/no-raw-payload, and reader round-trip checks.
4. Update conformance docs/state to reflect the upgraded release-gate path.

## Out Of Scope

- package versions, changesets, tags, releases, or publishing;
- third-party certification, hosted registry, or external service calls;
- new adapter packages;
- root/core framework/provider dependencies;
- schema changes;
- adapter runtime behavior changes unless required by conformance correctness.

## Acceptance Criteria

- Adapter conformance is easier to reuse as release evidence.
- Official adapters pass the shared conformance gate.
- Docs explain how the conformance gate is used without overstating certification.
- No package export drift or dependency drift is introduced.
- Validation passes.

## Suggested Commit

```text
test: add executable adapter conformance suite
```

## Focused Tests

```bash
pnpm exec vitest run packages/core/test/adapter-executable-conformance.test.ts packages/core/test/adapter-conformance-matrix.test.ts
```

## Chunk Gate

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm pack:smoke
git diff --check
```

## Stop Condition

Stop if the conformance upgrade requires a public certification program, schema change, new package, root/core framework dependency, network behavior, package-version/change-set work, or validation failure outside this conformance scope.
