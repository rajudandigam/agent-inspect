# Roadmap

AgentInspect is the **local evidence debugger and trajectory-test toolkit** for TypeScript AI agents: capture a framework-faithful execution tree, evaluate it with TraceFacts and TraceContract, produce share-checked Evidence v2, and optionally inspect the same local facts over read-only MCP—without a collector, account, or default upload.

**Product loop:** faithful local capture → TraceFacts → deterministic trajectory checks → share-checked portable evidence → local read-only coding-agent access.

This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md), [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md), and [docs/SUPPORT-LEVELS.md](docs/SUPPORT-LEVELS.md).

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · framework-aware but not framework-locked · no vendor upload by default · no maintainer-hosted SaaS dashboard · depth before breadth.

---

## Current — post-6.25 reliability program (complete through `6.29.0`)

**Current release line:** **6.29.0** (eighteen fixed-group public packages). Persisted schema **1.0**. Node.js **≥ 20**. **MIT**. Actively maintained.

Core boundary remains frozen. Evidence-backed **patches and minors** may continue outside this train when justified. Retained-use / conformance claims stay `BLOCKED_ON_EXTERNAL_EVIDENCE`. **`6.30.0` is not invented** without external fixtures. **v7 is NO-GO** (assessment only).

| Release | Theme | Status |
| ------- | ----- | ------ |
| **6.19.0**–**6.25.0** | Adoption-first contracts, fidelity, distribution, stability baseline | Published |
| **6.25.1** | Critical retry / omitted-payload correctness | Published |
| **6.25.2** | Reserved corrective patch | Skipped (clean) |
| **6.26.0** | Outcome-aware behavioral sessions (#362) | Published |
| **6.27.0** | Bounded safe recovery contracts | Published |
| **6.28.0** | Reviewer-reproducible Evidence | Published |
| **6.29.0** | Provider usage fidelity and adapter compatibility | Published |
| **6.30.0** | Conditional external conformance | **BLOCKED_ON_EXTERNAL_EVIDENCE** |
| **7.0.0** | Major | Assessment only / **NO-GO** |

```text
BLOCKED_ON_EXTERNAL_EVIDENCE
LAST_IMPLEMENTED_RELEASE: 6.29.0
V7_DECISION: NO-GO
```

Train state: [docs/implementation/RELEASE-TRAIN-STATE.md](docs/implementation/RELEASE-TRAIN-STATE.md).  
Canonical maintainer roadmap: [docs/implementation/ROADMAP.md](docs/implementation/ROADMAP.md).

---

## Later — conditional major

A major `v7` is **not scheduled**. Scheduling requires maintainer readiness criteria in the canonical roadmap and [docs/implementation/active/V7-READINESS-ASSESSMENT.md](docs/implementation/active/V7-READINESS-ASSESSMENT.md).
