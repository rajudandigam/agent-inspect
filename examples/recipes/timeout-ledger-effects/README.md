# Recipe: timeout-ledger-effects (#492 / Navya)

Keyless in-process fake ledger: the handler is actually invoked. Shows what
committed after a timeout without claiming exactly-once or real financial
effects. Saved traces keep the fault plan, whether that fault was applied,
each attempt's argument fingerprint, the observer window, and the report
claim when a report step actually ran. Verdicts are recomputed from those
files. A correct operation join does not hide an amount change, and an
`ETIMEDOUT` string without an applied-injection record is not treated as an
injection.

Synthetic only. Not Heimdall field invention.

## Saved verdict axes

| Console / field | Meaning |
| --- | --- |
| `windowCheck` (`observation` in verifier) | Ledger-**window check completed** (`passed` = same-run windows closed with passed status). **Not** proof the task or side effect is acceptable. |
| `effect` | Duplicate-marker / args consistency from **handler attempt** records. |
| `claim` | Report-boundary claim vs attempt markers; **`unknown`** when no report (does not override `effect=fail`). |
| `join` | Observer `ledger-window.markerIds` must **exactly match** attempt `markerId`s for that operation. |
| `handlerMarkers` | Count of distinct **`markerId`s on attempts** (handler/write boundary), not observer output. |
| `readback` | Correlated **external** effect state from `effect-readback` (`landed` / `did_not_land` / stale / foreign / conflicting). Separate from observation execution. |
| `readbackObs` | Whether the read-back **observation itself** completed (`status` on the outcome row). |

Handler attempts use `source: "handler"`. Observer windows use `source: "observer"`.
Kyle (N5) cases add pre-call `request-intent` (requestId + idempotencyKey) and a separately recorded `effect-readback`. Observation execution status stays on the outcome `status` field; external state lives only in evidence.

## Counterexample → control (chunk 06 audit)

| Counterexample | Control |
| --- | --- |
| In-memory ledger verdict | `verifySaved` / `TL-fresh-process` |
| Valid join + amount change | `TE-amount-mismatch` |
| Wrong join + matching args | `TF-wrong-operation-join` |
| Duplicate markers | `T02-duplicate-markers` |
| Incomplete window | `T03-incomplete-window` |
| Contradictory claim | `T04` / `TK-tampered-claim` |
| Missing report + bad effect | `TH-missing-report` |
| Timeout text without injection | `TJ-timeout-text-only` |
| Timeout, no correlated read-back | `K01-timeout-no-readback` |
| Timeout + landed read-back | `K02-landed` |
| Honest miss + did-not-land | `K03-did-not-land` |
| Stale / foreign / conflicting read-back | `K04` / `K05` / `K06` |
| Retry with same idempotency + landed | `K07-retry-reuse` |
| Shared approval/idempotency across ops | `K08-approval-reuse` |

No new contradictory-window probe was required: incomplete/missing window and marker-list probes already cover that class.

## Run

```bash
pnpm --filter agent-inspect-recipe-timeout-ledger-effects start
```
