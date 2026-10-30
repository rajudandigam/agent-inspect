# Operation and attempt identity — saved 6.31.23 evidence

All files below are unchanged excerpts of the October 22 synthetic packet.
Open a file on GitHub to inspect it; use **Raw** to obtain its original bytes.

## O01: one explicit action, two attempts

- [Source JSONL](O01-robb-one-op-two-attempts.source.jsonl)
- [Default OTLP JSON](O01-robb-one-op-two-attempts.default-otlp.json)
- [Saved contract result](O01-robb-one-op-two-attempts.contract-results.json)

The source contains a `logical-retrieve` parent and two `retrieve_policy`
children. Both attempts declare `operationId=op1`; their IDs are `a1` and `a2`,
with `retryOf=a1` on the second. The parent is explicitly recorded, not inferred
from equal tool names. This case asks whether the exported fields communicate
that relationship to a reviewer; it does not simulate sampling.

## O05: identical redelivery

- [Original source](O05-repeated-delivery-base.source.jsonl)
- [Original export](O05-repeated-delivery-base.default-otlp.json)
- [Repeated source delivery](O05-repeated-delivery.source.jsonl)
- [Export after repeated delivery](O05-repeated-delivery.default-otlp.json)
- [Saved counts and contract results](O05-repeated-delivery.contract-results.json)
- [Separate boundary-probe results](redelivery-results.json)

The saved comparison fails `maxAttempts=1` and passes `maxAttempts=2` in both
formats. Twelve source event rows represent two logical attempts in this
fixture. Repeated delivery of the same events is distinct from another handler
execution.

## Identity conflict and native-ID controls

[Saved residual results](residuals-results.json) retain the original 6.31.23
version field and warnings. The paired inputs and exports are in
[residuals](residuals/):

- Direct/nested identity conflicts, including long values with the same prefix,
  produce ambiguous-identity failures.
- Distinct native event IDs that resemble synthetic IDs still produce duplicate
  attempt-ID failures when they reuse an attempt ID.
- The opaque native-ID control also fails duplicate attempt identity.

These negative results are expected outcomes for these deliberately invalid
inputs. They do not mean every possible identity collision has been tested.
This subset omits the older boundary result file whose version field says
6.31.22; it is not relabeled as 6.31.23 evidence.

For maintained generator code, see the pinned
[F04 script](https://github.com/rajudandigam/agent-inspect/blob/495e9f3d587295e904a1aa72c2747b5bd7e6a4e3/scripts/f04-otlp-identity-evidence.mjs).
That source link is not a claim that the saved files were regenerated at that
later commit. See the [snapshot provenance](../README.md) and
[checksums](../manifest.json).
