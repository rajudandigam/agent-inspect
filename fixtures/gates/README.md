# Gate fixtures

Configs and trace sets for `agent-inspect gate` CI quality checks.

## Suite config

- `../configs/outcome-suite.suite.json` — passing suite case with `policyShown` observation

## Threshold examples

```bash
# Pass: low error rate on success traces
agent-inspect gate --dir fixtures/traces --max-error-rate 5

# Fail: cohort after traces exceed error rate / forbidden tool
agent-inspect gate \
  --dir fixtures/cohorts/before-after \
  --max-error-rate 5 \
  --forbid-tool deleteAccount
```
