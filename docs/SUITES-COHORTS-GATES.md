# Suites, cohorts, and gates

**Support level:** Beta  

Deterministic regression tooling over local traces and workspaces.

## Suites

- Validate expectations against **existing** traces (`suite validate` / config-driven checks)
- Aggregate status must not pass when all cases are missing evidence (all-skipped semantics)
- Executable “fresh run” modes exist only where harness/suite run is implemented — do not assume every template executes live agents

## Cohorts

- Baseline vs candidate comparison with tolerances
- Sample counts, missing values, and insufficient-evidence / not-comparable states
- Not every positive delta is a regression

## Gates

- CI-oriented thresholds (error rate, duration, etc.)
- Invalid ranges (negative / NaN / out-of-range percentages) are rejected
- Exit codes are intended for CI fail-closed use

## Artifacts

Suites/gates can emit local reports and CI summaries. Prefer share profiles before attaching to PRs.

## Limitations

- Cross-platform consumer matrix rows may still be pending in adoption evidence
- Full golden-path automation (broken → contract → suite → Studio) is only partially covered by scripts — see [GOLDEN-PATH.md](./GOLDEN-PATH.md)

Related: [CI-ARTIFACTS.md](./CI-ARTIFACTS.md) · [TRACE-CONTRACTS.md](./TRACE-CONTRACTS.md) · [CLI.md](./CLI.md)
