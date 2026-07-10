# Golden path (technical launch candidate)

The 6.7.x technical launch candidate path. Be precise about what is automated today.

## Automated packed path (CI)

From a packed `agent-inspect` install (`scripts/packed-quickstart-e2e.mjs` via `pnpm pack:smoke`):

```text
init --yes → demo → list → verify-safe <runId> --dir .agent-inspect
```

This proves install, scaffold, one local run, and safety verification.

## Recommended developer path (manual)

```text
init → demo → list → view/report → check → bundle --profile share → verify-safe
```

Use required positional targets (`<run-id>` or file path). See the root README five-minute path.

## Technical-but-not-fully-automated

`scripts/golden-path-e2e.mjs` covers a subset (init → inspect → verify-safe → report). It does **not** yet automate the full roadmap chain:

```text
broken → contract fail → suite → CI gate → fix → diff/cohort → Studio review
```

## External pilot step

Three external teams + design-partner Studio trial remain **pending**. Do not mark launch adoption complete without rows in [implementation/PRE-V7-ADOPTION-EVIDENCE.md](./implementation/PRE-V7-ADOPTION-EVIDENCE.md). Pilot kit: [PRE-V7-PILOT-KIT.md](./PRE-V7-PILOT-KIT.md).

## Pending product gaps (honest)

- TraceContract matchers / full contract depth
- Studio HTML productization for some pages
- Cross-platform consumer matrix evidence
- External Collector/Phoenix verification
