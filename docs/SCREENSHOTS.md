# Demos and screenshots

Curated terminal recordings and diagrams for AgentInspect **6.17.x**. They show **Debug / Prevent / Share** from one local trace — without a maintainer-hosted dashboard or vendor upload.

**Synthetic output only:** demos use committed [fixtures](../fixtures/README.md), [examples](../examples/README.md), and the [broken-agent-debugging](../examples/starters/broken-agent-debugging/) showcase. No external LLM calls or API keys.

**npm note:** Showcase GIFs live in `docs/assets/showcase/` for GitHub documentation. They are **not** shipped in the `agent-inspect` npm tarball. Brand SVGs used by the root README **are** included in the npm package.

**Provenance:** [assets/showcase/provenance.json](assets/showcase/provenance.json)

**Re-record helper:** `node scripts/render-showcase-tapes.mjs` (requires ffmpeg + Python Pillow)

**Older recordings:** [assets/demos/RECORDING.md](assets/demos/RECORDING.md)

---

## README showcase (6.17.x)

| Asset | Job |
| ----- | --- |
| [debug-tree.gif](assets/showcase/gif/debug-tree.gif) | Debug — `list` then inspect a local run |
| [check-pass-fail.gif](assets/showcase/gif/check-pass-fail.gif) | Prevent — `check --preset trajectory` plus shorthands, pass then fail |
| [evidence-bundle.gif](assets/showcase/gif/evidence-bundle.gif) | Share — `bundle --profile share` then `bundle verify` (relative `./evidence`) |
| [value-loop.svg](assets/showcase/diagrams/value-loop.svg) | Capture once → debug, prevent, share |

The check tape is named for the `check` command, not `gate`.

---

## Full six-flow set

| Flow | GIF | Video |
| ---- | --- | ----- |
| Debug tree / list | [debug-tree.gif](assets/showcase/gif/debug-tree.gif) | [debug-tree.webm](assets/showcase/video/debug-tree.webm) |
| Check pass/fail | [check-pass-fail.gif](assets/showcase/gif/check-pass-fail.gif) | [check-pass-fail.webm](assets/showcase/video/check-pass-fail.webm) |
| Evidence bundle | [evidence-bundle.gif](assets/showcase/gif/evidence-bundle.gif) | [evidence-bundle.webm](assets/showcase/video/evidence-bundle.webm) |
| Explain | [explain.gif](assets/showcase/gif/explain.gif) | [explain.webm](assets/showcase/video/explain.webm) |
| Redact (derived copy) | [redact.gif](assets/showcase/gif/redact.gif) | [redact.webm](assets/showcase/video/redact.webm) |

Rejected source tapes (not published): blank one-frame `docs/demo-kit/b77a3f11-….gif` (PNG mislabeled as GIF); kit `06-run-live.mp4` (not re-recorded from the canonical starter). Kit MP4s that printed `/private/tmp` or captioned `check` as `gate` were re-recorded.

---

## Canonical showcase commands

```bash
cd examples/starters/broken-agent-debugging
node demo-agent.mjs good
npx agent-inspect list --dir .agent-inspect
npx agent-inspect check demo-good --dir .agent-inspect \
  --preset trajectory --required-tool retrieve_policy --fail-on-observation failed
npx agent-inspect bundle demo-good --dir .agent-inspect --profile share --out ./evidence
npx agent-inspect bundle verify ./evidence
```

Stable run ids: `demo-good`, `demo-regression`, `demo-pii`.

---

## Earlier 6.7.x terminal GIFs

The files under [assets/demos/](assets/demos/) remain available as additional command-level recordings (`quickstart.gif`, `execution-tree.gif`, `error-handling.gif`, …). Prefer the 6.17.x showcase above for README and website hero media. Log-to-tree and export HTML visuals still live in that older set.
