# Active execution plan — next releases (6.17.8 → 6.19.0)

**Authority:** [../ROADMAP.md](../ROADMAP.md) · final release decision (2026-09-05)  
**Baseline:** published `6.17.8` · `origin/main` `4a1cd87` · schema `1.0`  
**Exclusions:** Gmail/outreach; local `npm publish`; schema 1.1; premature 6.20–6.22 implementation

## Release table

| Release | Theme | Required outcomes |
| --- | --- | --- |
| 6.17.8 | Closeout and trust-boundary patch | **published** |
| 6.17.9 | Conditional corrective patch | Only verified security/compatibility defects |
| 6.18.0 | Safe adoption and differentiation | code on main; **publish gate active** |
| 6.18.1 | Reserved patch | Adapter/CLI/security corrections only |
| 6.19.0 | External evidence and failure semantics | PR `#354` held until 6.18.0 publishes |
| 6.19.1 | Reserved patch | Reader/failure-fact compatibility corrections only |
| 6.20.0 | Flexible deterministic contracts | #308/#315 ordering modes; #309 alternate valid paths |
| 6.21.0 | Multi-agent evidence precision | #320 actor scope; #321 outcome provenance |
| 6.22.0 | Conditional design-partner recipes | #331 (design confirmed); provider-neutral CI evidence |

## Chunk status

| Chunk | Status |
| --- | --- |
| `phase0-roadmap-truth` | done |
| `6.17.8 A–E` | done (published) |
| `6.18.0 A–H` | code done; publish pending (`#350`) |
| `6.19.0 A–D` | PR `#354` open (hold merge) |
| `6.20–6.22 labels only` | pending after 6.19 publish |

## Open PR dispositions

| PR | Train | Disposition |
| ---: | --- | --- |
| #350 | 6.18 Version Packages | Merge after release gate + pack:smoke fix |
| #354 | 6.19 | Hold until 6.18.0 on npm |
| #297 | preflight | CONFLICTING; do not block |
| #306 | — | Draft hold |
| #315 | 6.20 | Keep open |
| #142 | hold | External design-partner gate |

## Stop rules

- Do not merge Version Packages until the train’s code chunks are on `main` and the release gate is green.
- Do not implement 6.20–6.22 in this run.
- Do not merge `#354` before `agent-inspect@6.18.0` is on npm.
- MCP hardening must not claim “sanitization” of instruction-like text.
