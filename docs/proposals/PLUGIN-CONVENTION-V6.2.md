# Plugin convention — v6.2.0 RFC

**Status:** Accepted for v6.2.0 train  
**Baseline:** `agent-inspect@6.1.0`  
**Related:** [ADAPTER-CONFORMANCE.md](../ADAPTER-CONFORMANCE.md) · [V6.2.0-EXECUTION-PLAN.md](../implementation/release-trains/V6.2.0-EXECUTION-PLAN.md)

Define an **explicit-install plugin naming convention** for AgentInspect extensions. No hosted marketplace. No automatic remote loading. No untrusted code execution by default.

## Naming

| Prefix | Purpose |
| ------ | ------- |
| `agent-inspect-plugin-*` | General plugins |
| `agent-inspect-adapter-*` | Framework adapters |
| `agent-inspect-renderer-*` | Trace renderers |
| `agent-inspect-check-*` | Deterministic checks |
| `agent-inspect-importer-*` | Trace importers |

## Manifest

Optional `agent-inspect-plugin.manifest.json` in package root:

```json
{
  "schemaVersion": "1.0",
  "id": "agent-inspect-adapter-example",
  "type": "adapter",
  "name": "Example Adapter",
  "version": "1.0.0",
  "privacy": {
    "captureMode": "metadata-only",
    "networkAllowed": false,
    "uploadAllowed": false,
    "redactionDocumented": true,
    "frameworkDepsPackageScoped": true
  }
}
```

## CLI

```bash
agent-inspect plugins list
agent-inspect plugins doctor
agent-inspect plugins validate <package>
```

## Rules

- Explicit `npm install` only — no remote marketplace
- No automatic `import()` of untrusted plugin code from CLI
- Adapter SDK conformance + privacy checklist required for adapters
- Unsafe plugins (network/upload by default) warn in `plugins doctor`

## Non-goals

- Hosted plugin marketplace
- Default dynamic plugin loading
- Plugin code signing infrastructure (v6.2)
