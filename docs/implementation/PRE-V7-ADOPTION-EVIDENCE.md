# Pre-v7 Adoption Evidence

Template for manual gates. **Do not fabricate entries.**

**Audit date:** 2026-07-10  
**Technical LC on npm:** `6.7.0` (planned v6.8 scope combined into 6.7.0 changeset)  
**Publication status:** Blocked on external evidence below — not on missing npm version `6.8.0`

## Design-partner acceptance (v6.6.0 gate — historical)

| Field | Value |
|-------|-------|
| Partner name | _pending_ |
| Date | _pending_ |
| Studio version | _pending_ (test against `6.7.0`) |
| Workflow completed | _pending_ |
| Blockers | _pending_ |
| Sign-off | _pending_ |

**Note:** v6.6.0 shipped without this gate satisfied. Remains required before treating launch candidate as adoption-proven.

## Pilot evidence (canonical roadmap gate)

| Team | Date | Scenario | CI retained | Studio trial | Status |
|------|------|----------|-------------|--------------|--------|
| 1 | _pending_ | golden-path | _pending_ | _pending_ | _pending_ |
| 2 | _pending_ | golden-path | _pending_ | _pending_ | _pending_ |
| 3 | _pending_ | golden-path | _pending_ | _pending_ | _pending_ |

**Required:** Three **external** teams with dated findings. Internal/repo runs do not count.

## Consumer compatibility matrix (v6.5.1)

| Environment | Node | Module | Status | Date | Evidence |
|-------------|------|--------|--------|------|----------|
| Linux | 20 | ESM | _pending_ | | |
| Linux | 22 | ESM | partial | 2026-07-10 | `compat:smoke` on publish CI (Ubuntu Node 22) |
| macOS | 20 | CJS | _pending_ | | |
| Windows | 22 | ESM | _pending_ | | |

**Executed locally:** `scripts/consumer-compat-matrix.mjs` can append one host row when run manually.  
**Not executed:** Full cross-platform matrix. Do not mark complete without real runs.

## v7 readiness inputs

After 6.7.x freeze and real pilot evidence:

- Security posture (v6.4.1 fixes retained)
- Contract/suite truth (v6.5.0 — partial vs expansive roadmap; see reconciliation audit)
- Studio product evidence (v6.6.0 — APIs strong, HTML UI partial)
- Standards round-trip (v6.7.0 — fixtures; external Collector/Phoenix pending)
- Golden-path automation (packed quickstart in CI; full scenario incomplete)
- Adoption evidence above

## Pilot kit (maintainer action)

When technical work is frozen, use:

- [DESIGN-PARTNER-GUIDE.md](../../DESIGN-PARTNER-GUIDE.md)
- [DEMO-SCRIPT.md](../../DEMO-SCRIPT.md)
- `examples/starters/` and `scripts/packed-quickstart-e2e.mjs` for partner onboarding

Record results only when partners return real data.
