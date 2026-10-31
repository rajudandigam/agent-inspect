# Commands — regenerate and verify

## Regenerate this packet (from repo root)

```bash
pnpm build
node scripts/f04-otlp-identity-evidence.mjs docs/evidence/otlp-identity-003-2026-10-29
```

The script exits **nonzero** on source/OTLP contract mismatches. A successful run prints JSON with `"failures": 0`.

After regeneration, recompute [manifest.json](manifest.json) (SHA-256 over all files except `manifest.json` itself) if byte-level provenance must stay current.

## Unit tests (OTLP export + identity round-trip)

```bash
pnpm exec vitest run packages/core/test/exporters/otlp-json-exporter.test.ts \
  packages/core/test/readers/otlp-identity-roundtrip.test.ts
```

## Verify manifest checksums

```bash
node -e "
const fs=require('fs'),crypto=require('crypto'),path=require('path');
const root='docs/evidence/otlp-identity-003-2026-10-29';
const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
let bad=0;
for (const f of m.files) {
  const buf=fs.readFileSync(path.join(root,f.path));
  const h=crypto.createHash('sha256').update(buf).digest('hex');
  if (h!==f.sha256||buf.length!==f.bytes) { console.error('MISMATCH',f.path); bad++; }
}
console.log(bad? 'FAIL '+bad:'OK '+m.files.length+' files');
process.exit(bad?1:0);
"
```
