# Walkthrough: share-safe bundle → local Studio

This walkthrough takes one agent run from a **share-safe evidence bundle** to viewing it in a **local, read-only Studio**. Everything is local — no upload, no hosted service.

**See also:** [BUNDLES.md](./BUNDLES.md) · [EVIDENCE-FORMAT.md](./EVIDENCE-FORMAT.md) · [SELF-HOSTING.md](./SELF-HOSTING.md) · [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md)

## Before you start

- **Never bundle production secrets or raw production traces.** Build with the `share` (default) or `strict` redaction profile, or use synthetic runs.
- Studio is a self-hosted, read-only analyzer (`@agent-inspect/studio`). It never calls the network by default.

## 1. Build a share-safe bundle

```bash
# share is the default profile; strict drops prompts/outputs as well
npx agent-inspect bundle <run-id> --profile share --out ./bundle-out
```

You can also bundle a session or a time window:

```bash
npx agent-inspect bundle --session <session-id> --profile share --out ./bundle-out
npx agent-inspect bundle --since 24h --profile share --out ./bundle-out
```

## 2. Verify integrity before sharing

```bash
npx agent-inspect bundle verify ./bundle-out
```

A `pass` result means the manifest, hashes, and file presence all check out. Attach or move the bundle only after it verifies.

## 3. Point Studio at a workspace registry

Studio reads a registry manifest that names its database and import directories. Create `studio-registry.json` as described in [SELF-HOSTING.md](./SELF-HOSTING.md#studio-registry) (it declares `db` and `import.bundlesDir`).

## 4. Import the bundle

```bash
npx agent-inspect studio import bundle \
  --path ./bundle-out \
  --workspace ./studio-registry.json
```

This validates the bundle's `metadata.json`, copies it into the registry's `import.bundlesDir`, and records idempotent SQLite bookkeeping — re-importing the same bundle does not duplicate it.

## 5. View it in Studio

```bash
npx agent-inspect studio --workspace ./studio-registry.json --open
```

Studio starts on `127.0.0.1:7340` (read-only) and opens the imported run locally. Ingest channels stay off unless you explicitly pass `--ingest`.

## Notes

- Import is operator-initiated and local: Studio does not pull bundles on its own.
- To bring a bundle produced by CI into Studio, the operator can download the CI artifact and import it the same way (`studio import github`, see [SELF-HOSTING.md](./SELF-HOSTING.md)).
- The `studio` command requires the optional `@agent-inspect/studio` package; it adds no dependency to AgentInspect core.
