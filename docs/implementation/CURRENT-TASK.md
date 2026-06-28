# Current Codex Task

## Identity

```yaml
train: "v2.3.0"
chunk: "v2.3-1-ai-sdk-adapter-hardening"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.3-0-post-v2.2-reconciliation-and-adapter-scorecard"
```

## Goal

Harden `@agent-inspect/ai-sdk` as the first v2.3 framework adapter priority while preserving metadata-only, explicit telemetry, and no root/core AI SDK dependency boundaries.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.3.0-EXECUTION-PLAN.md`
- `docs/ADAPTERS.md`
- `docs/ADAPTER-CONFORMANCE.md`
- `docs/implementation/adapter-conformance-matrix.json`
- `packages/ai-sdk/src/`
- `packages/ai-sdk/test/`

## Current Evidence

- v2.3 chunk 0 documented adapter priorities and demand gates.
- AI SDK is v2.3 priority 1 because it has explicit open adapter work, direct package usage, and a framework-native telemetry boundary.
- Required host controls remain `experimental_telemetry.isEnabled: true`, `recordInputs: false`, and `recordOutputs: false`.
- The adapter must remain optional-package-only and must not add AI SDK, framework, provider, or telemetry dependencies to root/core.

## In Scope

1. Improve AI SDK adapter coverage for `generateText`, `streamText`, tool calls, Next.js/local route-style usage, parallel calls, abort/error lifecycle, token metadata, and privacy defaults.
2. Add or update no-network fixtures/tests under the AI SDK package.
3. Update recipes/docs only as needed for accurate adoption guidance.
4. Preserve package ESM/CJS/declaration compatibility and package smoke expectations.

## Out Of Scope

- package versions, changesets, tags, releases, or publishing;
- AI SDK dependency in root/core;
- `recordInputs` or `recordOutputs` true by default;
- raw prompt/output/tool payload capture by default;
- provider calls, hosted telemetry, replay, or cassette behavior;
- Mastra/Nest/OpenAI/LangChain runtime changes;
- schema changes.

## Acceptance Criteria

- AI SDK adapter tests cover the prioritized host shapes without network calls.
- Privacy defaults and required host controls remain documented and tested.
- No root/core dependency or package export drift is introduced.
- Existing AI SDK imports remain compatible.
- Validation passes.

## Suggested Commit

```text
feat(ai-sdk): harden telemetry adapter
```

## Focused Tests

```bash
pnpm exec vitest run packages/ai-sdk/test/api-stability.test.ts packages/core/test/adapter-executable-conformance.test.ts
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

Stop if the AI SDK integration needs a new public API, schema change, root/core dependency, default network behavior, raw payload capture by default, package-version/change-set work, or validation failure outside the AI SDK hardening scope.
