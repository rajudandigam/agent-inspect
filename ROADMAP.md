# Roadmap

AgentInspect is the **local evidence debugger and trajectory-test toolkit** for TypeScript AI agents: capture a framework-faithful execution tree, evaluate it with TraceFacts and TraceContract, produce share-checked Evidence v2, and optionally inspect the same local facts over read-only MCP—without a collector, account, or default upload.

**Product loop:** faithful local capture → TraceFacts → deterministic trajectory checks → share-checked portable evidence → local read-only coding-agent access.

This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md), [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md), and [docs/SUPPORT-LEVELS.md](docs/SUPPORT-LEVELS.md).

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · framework-aware but not framework-locked · no vendor upload by default · no maintainer-hosted SaaS dashboard · depth before breadth.

---

## Current — published `6.31.7`

**Current release line:** **6.31.6** (eighteen fixed-group public packages). Persisted schema **1.0**. Node.js **≥ 20**. **MIT**. Actively maintained.

Core boundary frozen; evidence-backed **security, correctness, compatibility, interoperability, and public-truth patches** remain active. Retained-use / conformance claims stay gated on accepted external evidence. **v7 is NO-GO**.

| Release | Theme | Status |
| ------- | ----- | ------ |
| **6.19.0**–**6.31.6** | Adoption through MCP trust + false-SAFE security patches | Published |
| **6.31.7** | Correctness: timeline identity + false-pass checks | Next patch |
| **6.31.8** | Export fidelity + OTLP encoding/validator | Planned patch |
| **6.32.0** | Conditional external conformance + compact review | **BLOCKED_ON_EXTERNAL_EVIDENCE** |
| **6.33.0** | Runnable integrations when additive | Planned minor |
| **7.0.0** | Major | Assessment only / **NO-GO** |

```text
LAST_PUBLISHED_RELEASE: 6.31.7
V7_DECISION: NO-GO
```

Train state: [docs/implementation/RELEASE-TRAIN-STATE.md](docs/implementation/RELEASE-TRAIN-STATE.md).  
Canonical maintainer roadmap: [docs/implementation/ROADMAP.md](docs/implementation/ROADMAP.md).

---

## Later — conditional major

A major `v7` is **not scheduled**. Scheduling requires maintainer readiness criteria in the canonical roadmap and [docs/implementation/active/V7-READINESS-ASSESSMENT.md](docs/implementation/active/V7-READINESS-ASSESSMENT.md).
