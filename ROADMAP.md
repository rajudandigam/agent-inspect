# Roadmap

AgentInspect is the **local evidence debugger and trajectory-test toolkit** for TypeScript AI agents: capture a framework-faithful execution tree, evaluate it with TraceFacts and TraceContract, produce share-checked Evidence v2, and optionally inspect the same local facts over read-only MCP—without a collector, account, or default upload.

**Product loop:** faithful local capture → TraceFacts → deterministic trajectory checks → share-checked portable evidence → local read-only coding-agent access.

This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md), [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md), and [docs/SUPPORT-LEVELS.md](docs/SUPPORT-LEVELS.md).

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · framework-aware but not framework-locked · no vendor upload by default · no maintainer-hosted SaaS dashboard · depth before breadth.

---

## Current — repository health and evidence UX (`6.17.1` → `6.18.x`)

**Current release on npm:** **6.17.2** (eighteen fixed-group public packages). Persisted schema **1.0**. Node.js **≥ 20**. **MIT**. Actively maintained.

Active maintainer program: repository health and public-truth cleanup, single-source docs, trajectory/Evidence CI UX, public technical proof, and stable niche packaging — before any conditional v7 assessment.

| Release | Theme | Status |
| ------- | ----- | ------ |
| **6.7.4**–**6.12.1** | Prior Stability and Focus program | Published |
| **6.12.2** | Logical lifecycle projection for checks | Published |
| **6.12.3** / **6.13.0** | TraceFacts, semantic parity, experimental matchers | Published |
| **6.14.0** / **6.14.1** | Evidence-first CI + public positioning | Published |
| **6.14.2** | Swarm self-parent + safety precision | Published |
| **6.14.3** | Reserved corrective patch | Skipped |
| **6.15.0** | Fidelity classes A–E + reader APIs | Published |
| **6.15.1** | Reserved corrective patch | Skipped |
| **6.16.0** | Evidence-first CI / verified moderate + swarm gates | Published |
| **6.16.1** | Repository health and public truth | Published |
| **6.16.2** | Canonical docs / website single-source | Published |
| **6.17.0** | Trajectory-gate and Evidence v2 workflow UX | Published |
| **6.17.1** | Public technical proof and demos | Planned |
| **6.18.0** | Stable niche launch packaging | Planned |
| **6.18.x** | Maintenance | Planned |
| **v7** | Conditional major — assessment only | Not scheduled |

Train state: [docs/implementation/RELEASE-TRAIN-STATE.md](docs/implementation/RELEASE-TRAIN-STATE.md).
Canonical maintainer roadmap: [docs/implementation/ROADMAP.md](docs/implementation/ROADMAP.md).

---

## Later — conditional major

A major `v7` is **not scheduled**. Scheduling requires maintainer readiness criteria in the canonical roadmap.
