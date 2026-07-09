# Plugin convention (v6.2+)

AgentInspect plugins use **explicit npm install** only. There is no hosted marketplace and no automatic remote code loading.

## Naming

| Prefix | Purpose |
| ------ | ------- |
| `agent-inspect-plugin-*` | General plugins |
| `agent-inspect-adapter-*` | Framework adapters |
| `agent-inspect-renderer-*` | Trace renderers |
| `agent-inspect-check-*` | Deterministic checks |
| `agent-inspect-importer-*` | Trace importers |

## Manifest

Add `agent-inspect-plugin.manifest.json` to your package root:

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

See [fixtures/plugins/valid-manifest.json](../fixtures/plugins/valid-manifest.json) for a committed example.

## CLI

```bash
agent-inspect plugins list
agent-inspect plugins doctor
agent-inspect plugins validate agent-inspect-adapter-example
```

`plugins doctor` warns when a manifest declares network or upload behavior.

## Adapter SDK

Use `@agent-inspect/adapter-sdk` for:

- `parsePluginManifest` / `readPluginManifestFile`
- `runAdapterConformance` — lifecycle and reader round-trip checks
- `runPrivacyChecklist` — metadata-only, no-network, no-upload defaults

See [ADAPTER-CONFORMANCE.md](./ADAPTER-CONFORMENCE.md) and the [plugin RFC](./proposals/PLUGIN-CONVENTION-V6.2.md).

## Non-goals

- Hosted plugin marketplace
- Default dynamic `import()` of untrusted plugin code from CLI
- Plugin code signing (v6.2)
