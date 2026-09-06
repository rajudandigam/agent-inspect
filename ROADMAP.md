# Roadmap

AgentInspect is the **local evidence debugger and trajectory-test toolkit** for TypeScript AI agents: capture a framework-faithful execution tree, evaluate it with TraceFacts and TraceContract, produce share-checked Evidence v2, and optionally inspect the same local facts over read-only MCP—without a collector, account, or default upload.

**Product loop:** faithful local capture → TraceFacts → deterministic trajectory checks → share-checked portable evidence → local read-only coding-agent access.

This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md), [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md), and [docs/SUPPORT-LEVELS.md](docs/SUPPORT-LEVELS.md).

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · framework-aware but not framework-locked · no vendor upload by default · no maintainer-hosted SaaS dashboard · depth before breadth.

---

## Current — post-6.19 external evidence; next contracts (`6.20.x`)

**Current release line:** **6.19.0** (eighteen fixed-group public packages; Version Packages `#357` on `main`). Persisted schema **1.0**. Node.js **≥ 20**. **MIT**. Actively maintained.

Active maintainer program: flexible deterministic contracts (`6.20.0`), then multi-agent precision (`6.21.0`) and conditional design-partner recipes (`6.22.0`) — before any conditional v7 assessment.

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
| **6.17.1** | Public technical proof and demos | Published |
| **6.17.3** / **6.17.4** | Package line maintenance | Published |
| **6.17.5** | Release integrity + visible capability truth | Published |
| **6.17.8** | Closeout + trust-boundary | Published |
| **6.18.0** | Adapter bounded preview parity | Published |
| **6.19.0** | External evidence + derived failure semantics | Version Packages `#357` (confirm npm) |
| **6.20.0** | Alternate contract paths + ordering modes | Next (`#308`/`#315`/`#309`) |
| **6.21.0** | Actor-scoped contracts + outcome provenance | Planned (`#320`/`#321`) |
| **6.22.0** | Conditional design-partner recipes | Conditional (`#331`) |

Train state: [docs/implementation/RELEASE-TRAIN-STATE.md](docs/implementation/RELEASE-TRAIN-STATE.md).
Canonical maintainer roadmap: [docs/implementation/ROADMAP.md](docs/implementation/ROADMAP.md).

---

## Later — conditional major

A major `v7` is **not scheduled**. Scheduling requires maintainer readiness criteria in the canonical roadmap.
