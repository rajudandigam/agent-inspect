# Pre-v7 Pilot Kit

**Purpose:** External design-partner and three-team pilot evidence for the 6.7.x technical launch candidate.  
**Do not fabricate results.** Record only real partner outcomes in [implementation/PRE-V7-ADOPTION-EVIDENCE.md](implementation/PRE-V7-ADOPTION-EVIDENCE.md).

## What is shipping for partners

| Item | Version / path |
|------|----------------|
| npm | `agent-inspect@6.7.1` (and fixed-group packages) |
| Quickstart | `npx agent-inspect init --yes` → demo → `list` → `verify-safe` |
| Packed E2E (maintainers) | `pnpm run pack:smoke` |
| Demo script | [DEMO-SCRIPT.md](DEMO-SCRIPT.md) |
| Design partner guide | [DESIGN-PARTNER-GUIDE.md](DESIGN-PARTNER-GUIDE.md) |
| Broken-agent starter | `examples/starters/broken-agent-debugging` |
| Studio (Beta) | `@agent-inspect/studio` — customer-owned, local |

## Partner trial checklist (copy per team)

1. Install `agent-inspect@6.7.1` on Node ≥ 20.
2. Complete five-minute quickstart (init → one run → verify-safe).
3. Run at least one framework path (AI SDK, OpenAI Agents, or LangChain) **or** observe/manual path.
4. Optionally run Studio against a local workspace.
5. Optionally retain a CI check/suite gate on a PR.
6. Return dated findings: blockers, what worked, whether they will keep using it.

## Evidence required before distinct 6.8.0

From the canonical roadmap:

- One design-partner Studio trial (sign-off row)
- Three **external** teams with golden-path trial
- At least one retained CI contract/gate per pilot set
- At least one Studio trial in the pilot set
- Dated findings — no internal-only rows

## Maintainer stop condition

When this kit is prepared and 6.7.1 is on npm:

```text
trainStatus: blocked-on-external-pilot
```

Do **not** schedule or implement v7 until adoption gates in [implementation/release-trains/V7.0.0-READINESS-ASSESSMENT.md](implementation/release-trains/V7.0.0-READINESS-ASSESSMENT.md) are met and a maintainer explicitly authorizes a v7 train.
