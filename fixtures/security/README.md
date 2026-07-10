# Security adversarial fixtures (v6.4.1)

Corpus for traversal, XSS, manifest coercion, and MCP oversize regression tests.

## Categories

| File | Category | Purpose |
|------|----------|---------|
| `xss-suite-case.json` | XSS | Suite case fields with HTML/script payloads |
| `traversal-run-ids.json` | Traversal | Run id path escape attempts |
| `manifest-string-boolean.json` | Manifest | String `"false"` must not coerce to true |
| `mcp-oversize-payload.json` | MCP bounds | Large nested payload for byte-cap tests |

These fixtures are referenced by package tests; they must not contain real secrets.
