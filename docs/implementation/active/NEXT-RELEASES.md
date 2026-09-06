# Active execution plan — next releases (post-6.19.0)

**Authority:** [../ROADMAP.md](../ROADMAP.md) · final release decision (2026-09-05)  
**Baseline:** **published** `agent-inspect@6.19.0` on npm · Version Packages `#357` (`4e0d794`) · schema `1.0`
**Exclusions:** Gmail/outreach; local `npm publish`; schema 1.1; premature 6.20–6.22 implementation without authorization

## Release table

| Release | Theme | Required outcomes |
| --- | --- | --- |
| 6.17.8 | Closeout and trust-boundary patch | **published** |
| 6.17.9 | Conditional corrective patch | Only verified security/compatibility defects |
| 6.18.0 | Safe adoption and differentiation | **published** (`#350`) |
| 6.18.1 | Reserved patch | Adapter/CLI/security corrections only |
| 6.19.0 | External evidence and failure semantics | **published** (`#354` + `#357` + Trusted Publish `34013658849`) |
| 6.19.1 | Reserved patch | Reader/failure-fact compatibility corrections only |
| 6.20.0 | Flexible deterministic contracts | #308/#315 ordering modes; #309 alternate valid paths |
| 6.21.0 | Multi-agent evidence precision | #320 actor scope; #321 outcome provenance |
| 6.22.0 | Conditional design-partner recipes | #331 (design confirmed); provider-neutral CI evidence |

## Chunk status

| Chunk | Status |
| --- | --- |
| `phase0-roadmap-truth` | done |
| `6.17.8 A–E` | done (published) |
| `6.18.0 A–H` | done (published) |
| `6.19.0 A–D` | done (published on npm) |
| `6.20–6.22 labels only` | done (`#358`) |

## Issue → train labels (Phase 4)

| Issues / PR | Train | Label |
| --- | --- | --- |
| #308, #315, #309 | **6.20** | `roadmap-now` |
| #320, #321 | **6.21** | `roadmap-next` |
| #331 | conditional **6.22** | `roadmap-future` (design confirmed; existing APIs only; not implemented) |

## Open PR dispositions

| PR | Train | Disposition |
| ---: | --- | --- |
| #315 | 6.20 | Keep open until 6.20 implementation train |
| #297 | preflight | CONFLICTING; do not block |
| #306 | — | Draft hold |
| #142 | hold | External design-partner gate |

## Stop rules

- Do not implement 6.20–6.22 feature code in Phase 4.
- Do not merge Version Packages for a future train from this hygiene PR.
- MCP hardening must not claim “sanitization” of instruction-like text.
