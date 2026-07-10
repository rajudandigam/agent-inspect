# Roadmap

AgentInspect is the **local-first trace workbench** for TypeScript AI agents — understand, debug, compare, annotate, and export agent runs locally before you need a hosted observability platform.

**Product loop:** capture → understand → enforce → verify/bundle → review locally or in customer-owned Studio.

This public roadmap describes direction — not a delivery guarantee. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md), [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md), and [docs/SUPPORT-LEVELS.md](docs/SUPPORT-LEVELS.md).

**Principles:** CLI-first · TypeScript-first · dependency-light · safe-by-default · framework-aware but not framework-locked · no vendor upload by default · no maintainer-hosted SaaS dashboard.

---

## Current — 6.7.x adoption freeze

**Current release on npm:** **6.7.2** (eighteen fixed-group public packages). Persisted schema **1.0**. See [CHANGELOG.md](CHANGELOG.md#672).

| Area | Status |
| ---- | ------ |
| Technical launch candidate | Shipped as **6.7.0** (planned v6.8 scope combined into that release) |
| Presentation / docs patch | Shipped as **6.7.2** |
| External pilot evidence | Pending — [docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md](docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md) |
| Distinct `6.8.0` | Not published; not scheduled without pilot evidence |
| **v7** | Conditional — **not scheduled** |

Train state: [docs/implementation/RELEASE-TRAIN-STATE.md](docs/implementation/RELEASE-TRAIN-STATE.md).  
Canonical maintainer roadmap: [docs/implementation/ROADMAP-V6.4-TO-PRE-V7.md](docs/implementation/ROADMAP-V6.4-TO-PRE-V7.md).

Freeze allows security, correctness, compatibility, packaging, and documentation fixes only — not product expansion.

---

## Later — conditional v7

v7 remains gated on adoption evidence and an explicit maintainer readiness assessment. See [docs/implementation/release-trains/V7.0.0-READINESS-ASSESSMENT.md](docs/implementation/release-trains/V7.0.0-READINESS-ASSESSMENT.md).

Do not treat exploratory ideas as committed delivery.

---

## Explicit non-goals

- Maintainer-hosted SaaS / multi-tenant dashboard
- Production APM replacement
- Default vendor telemetry upload
- Automatic universal framework monkey-patching
- Default replay / cassette execution
- Cost analytics engine
- Raw chain-of-thought capture

AgentInspect **complements** LangSmith, Langfuse, Braintrust, Phoenix/OpenInference, OpenTelemetry, and similar platforms. It does not replace their production or eval workflows.

---

## History and contribution

- Release notes: [CHANGELOG.md](CHANGELOG.md)
- Historical v3.5→v7 planning: [docs/implementation/ROADMAP_V3_5_TO_V7.md](docs/implementation/ROADMAP_V3_5_TO_V7.md)
- Archived train evidence: [docs/archive/implementation/](docs/archive/implementation/)
- Contributor entry: [GOOD-FIRST-ISSUES.md](GOOD-FIRST-ISSUES.md) · [CONTRIBUTING.md](CONTRIBUTING.md)

Maintainers triage against [docs/community/PROJECT-VISION.md](docs/community/PROJECT-VISION.md).
