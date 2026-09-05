# Active execution plan — next releases (6.17.8 → 6.19.0)

**Authority:** [../ROADMAP.md](../ROADMAP.md) · final release decision (2026-09-05)  
**Baseline:** published `6.17.7` · `origin/main` `1b5351c` · schema `1.0`  
**Exclusions:** Gmail/outreach; local `npm publish`; schema 1.1; premature 6.20–6.22 implementation

## Release table

| Release | Theme | Required outcomes |
| --- | --- | --- |
| 6.17.8 | Closeout and trust-boundary patch | #340; untrusted trace/MCP hardening; tracker truth; completed-issue closure; #297 only if current and green |
| 6.17.9 | Conditional corrective patch | Only verified security/compatibility defects found after or excluded from 6.17.8 |
| 6.18.0 | Safe adoption and differentiation | same-output/wrong-path proof; no-key official adapters; preview parity; residual safety; bounded CLI redaction policy; human error tree |
| 6.18.1 | Reserved patch | Adapter/CLI/security corrections only |
| 6.19.0 | External evidence and failure semantics | custom readers; foreign-source fixture; derived failure roles; architectural-intent interop; bounded prior-context references |
| 6.19.1 | Reserved patch | Reader/failure-fact compatibility corrections only |
| 6.20.0 | Flexible deterministic contracts | #308/#315 ordering modes; #309 alternate valid paths |
| 6.21.0 | Multi-agent evidence precision | #320 actor scope; #321 outcome provenance |
| 6.22.0 | Conditional design-partner recipes | #331 (design confirmed); provider-neutral CI evidence; validated authority/retry/handoff recipes |

## Chunk status

| Chunk | Status |
| --- | --- |
| `phase0-roadmap-truth` | in progress |
| `6.17.8-A #340 clean --keep` | pending |
| `6.17.8-B MCP untrusted-trace` | pending |
| `6.17.8-C close completed issues` | pending |
| `6.17.8-D #297/#306` | pending (non-blocking) |
| `6.17.8-E Trusted Publish` | pending |
| `6.18.0 A–H` | pending |
| `6.19.0 A–D` | pending |
| `6.20–6.22 labels only` | pending |

## Open PR dispositions

| PR | Train | Disposition |
| ---: | --- | --- |
| #340 | 6.17.8 | Land first |
| #297 | 6.17.8 if green else 6.18 preflight | Consolidate; #306 superseded after |
| #306 | — | Supersede after #297 |
| #307 | 6.18 | Rebase/land |
| #315 | 6.20 | Keep open |
| #295 | 6.18-H | Explicit VS Code scope decision |
| #142 | hold | External design-partner gate |

## Stop rules

- Do not merge Version Packages until the train’s code chunks are on `main` and the release gate is green.
- Do not implement 6.20–6.22 in this run.
- Invalid `clean --keep` must never delete traces.
- MCP hardening must not claim “sanitization” of instruction-like text.
